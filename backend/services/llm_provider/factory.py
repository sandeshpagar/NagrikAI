import json
import logging
import urllib.request
import urllib.error
from typing import Optional, Dict, Any
from abc import ABC, abstractmethod

from config import settings

logger = logging.getLogger("nagrikai.llm_provider")

class BaseLLMProvider(ABC):
    """Abstract base class for all NagrikAI LLM providers."""

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    def is_available(self) -> bool:
        pass

    @abstractmethod
    def generate_text(self, prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.2) -> str:
        pass

    @abstractmethod
    def generate_json(self, prompt: str, system_prompt: Optional[str] = None) -> Dict[str, Any]:
        pass


class HeuristicLLMProvider(BaseLLMProvider):
    """
    Deterministic zero-network fallback provider.
    Guarantees that NagrikAI never crashes if local or cloud LLMs are unreachable.
    """

    @property
    def name(self) -> str:
        return "heuristic"

    def is_available(self) -> bool:
        return True

    def generate_text(self, prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.2) -> str:
        prompt_lower = prompt.lower()
        if "escalat" in prompt_lower:
            return (
                "Statutory notice: Grievance SLA has reached critical threshold without field resolution. "
                "In accordance with Maharashtra RTSA 2015, case is escalated to Senior Authority for immediate supervisory intervention."
            )
        if "citizen" in prompt_lower or "plain-language" in prompt_lower:
            return (
                "Your grievance has been validated and assigned to the municipal maintenance squad. "
                "Field crew inspection is underway with guaranteed statutory resolution window."
            )
        return (
            "Municipal Directive: Immediate on-site inspection scheduled. "
            "Field engineer deployed with necessary materials and safety barricades."
        )

    def generate_json(self, prompt: str, system_prompt: Optional[str] = None) -> Dict[str, Any]:
        prompt_lower = prompt.lower()
        
        category = "Road Infrastructure & Public Safety"
        department = "PMC Civil Works & Road Maintenance"
        priority = "HIGH"
        sla_hours = 24

        if "water" in prompt_lower or "pipe" in prompt_lower or "leak" in prompt_lower:
            category = "Water Supply & Sewerage"
            department = "PMC Water Supply & Sewerage Department"
            priority = "HIGH"
            sla_hours = 24
        elif "garbage" in prompt_lower or "waste" in prompt_lower or "dump" in prompt_lower:
            category = "Solid Waste Management"
            department = "PMC Solid Waste Management Department"
            priority = "MEDIUM"
            sla_hours = 48
        elif "light" in prompt_lower or "electric" in prompt_lower or "pole" in prompt_lower or "wire" in prompt_lower:
            category = "Street Lighting & Electrical"
            department = "PMC Electrical & Street Lighting Department"
            priority = "CRITICAL" if "live" in prompt_lower or "exposed" in prompt_lower else "HIGH"
            sla_hours = 12 if priority == "CRITICAL" else 24

        return {
            "category": category,
            "subcategory": "Urgent Maintenance",
            "priority": priority,
            "department": department,
            "sla_hours": sla_hours,
            "recommended_action": "Deploy rapid response unit for verification and on-site remediation.",
            "decision": "ACTION_SCHEDULED",
            "confidence": 92.5,
            "escalation_required": False
        }


class OllamaLLMProvider(BaseLLMProvider):
    """
    Local Ollama sovereign provider (Qwen 2.5 7B, Llama 3.2).
    Connects to local Ollama HTTP API (http://localhost:11434).
    """

    def __init__(self, base_url: Optional[str] = None, model: Optional[str] = None):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.model = model or settings.OLLAMA_TEXT_MODEL
        self._fallback = HeuristicLLMProvider()

    @property
    def name(self) -> str:
        return f"ollama:{self.model}"

    def is_available(self) -> bool:
        try:
            req = urllib.request.Request(f"{self.base_url}/api/version", method="GET")
            with urllib.request.urlopen(req, timeout=1.5) as response:
                return response.status == 200
        except Exception:
            return False

    def generate_text(self, prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.2) -> str:
        if not self.is_available():
            logger.warning("[OLLAMA OFFLINE] Falling back to heuristic text generation.")
            return self._fallback.generate_text(prompt, system_prompt, temperature)

        full_prompt = f"System: {system_prompt}\n\nUser: {prompt}" if system_prompt else prompt
        payload = {
            "model": self.model,
            "prompt": full_prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "top_p": 0.9,
            },
        }

        try:
            req = urllib.request.Request(
                f"{self.base_url}/api/generate",
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=5.0) as response:
                res_json = json.loads(response.read().decode("utf-8"))
                return res_json.get("response", "").strip()
        except Exception as e:
            logger.warning(f"Ollama text generation error or timeout (>5s): {e}. Falling back to heuristic.")
            return self._fallback.generate_text(prompt, system_prompt, temperature)

    def generate_json(self, prompt: str, system_prompt: Optional[str] = None) -> Dict[str, Any]:
        if not self.is_available():
            logger.warning("[OLLAMA OFFLINE] Falling back to heuristic JSON generation.")
            return self._fallback.generate_json(prompt, system_prompt)

        full_prompt = f"System: {system_prompt}\n\nUser: {prompt}\n\nRespond with valid JSON only." if system_prompt else f"{prompt}\n\nRespond with valid JSON only."
        payload = {
            "model": self.model,
            "prompt": full_prompt,
            "format": "json",
            "stream": False,
            "options": {
                "temperature": 0.1,
            },
        }

        try:
            req = urllib.request.Request(
                f"{self.base_url}/api/generate",
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=5.0) as response:
                res_json = json.loads(response.read().decode("utf-8"))
                raw_text = res_json.get("response", "").strip()
                return json.loads(raw_text)
        except Exception as e:
            logger.warning(f"Ollama JSON generation error or timeout (>5s): {e}. Falling back to heuristic.")
            return self._fallback.generate_json(prompt, system_prompt)


class OpenRouterLLMProvider(BaseLLMProvider):
    """
    OpenRouter API provider (OpenAI-compatible) with free tier models.
    Supports meta-llama/llama-3.2-3b-instruct:free, google/gemini-2.0-flash-exp:free, etc.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
    ):
        self.api_key = api_key or getattr(settings, "OPENROUTER_API_KEY", "")
        self.base_url = (base_url or getattr(settings, "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")).rstrip("/")
        self.model = model or getattr(settings, "OPENROUTER_MODEL", "meta-llama/llama-3.2-3b-instruct:free")
        self._fallback = HeuristicLLMProvider()

    @property
    def name(self) -> str:
        return f"openrouter:{self.model}"

    def is_available(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    def generate_text(self, prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.2) -> str:
        if not self.is_available():
            logger.warning("[OPENROUTER KEY MISSING] Falling back to heuristic text generation.")
            return self._fallback.generate_text(prompt, system_prompt, temperature)

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
        }

        try:
            req = urllib.request.Request(
                f"{self.base_url}/chat/completions",
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.api_key}",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "NagrikAI Grievance Agent",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=20.0) as response:
                res_json = json.loads(response.read().decode("utf-8"))
                return res_json["choices"][0]["message"]["content"].strip()
        except Exception as e:
            logger.error(f"OpenRouter text generation error: {e}. Falling back to heuristic.")
            return self._fallback.generate_text(prompt, system_prompt, temperature)

    def generate_json(self, prompt: str, system_prompt: Optional[str] = None) -> Dict[str, Any]:
        if not self.is_available():
            logger.warning("[OPENROUTER KEY MISSING] Falling back to heuristic JSON generation.")
            return self._fallback.generate_json(prompt, system_prompt)

        augmented_system = (
            (system_prompt + "\n" if system_prompt else "")
            + "CRITICAL: You must reply with a valid JSON object ONLY. No other prose, comments, or backticks."
        )
        raw_text = self.generate_text(prompt, system_prompt=augmented_system, temperature=0.1)
        
        # Clean potential markdown backticks
        cleaned = raw_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        try:
            return json.loads(cleaned)
        except Exception as e:
            logger.error(f"OpenRouter output JSON parse failed: {e}. Falling back to heuristic.")
            return self._fallback.generate_json(prompt, system_prompt)


def get_llm_provider(provider_type: Optional[str] = None) -> BaseLLMProvider:
    """
    Factory function returning the active LLM provider based on config or request.
    Always falls back gracefully to HeuristicLLMProvider without crashing.
    """
    p_type = (provider_type or settings.AI_PROVIDER).lower()

    if p_type == "openrouter":
        provider = OpenRouterLLMProvider()
        if provider.is_available():
            return provider
        logger.info("[LLM FACTORY] OpenRouter key not configured, falling back to Ollama or Heuristic.")

    if p_type == "ollama" or p_type == "openrouter":
        provider = OllamaLLMProvider()
        if provider.is_available():
            return provider
        logger.info("[LLM FACTORY] Ollama daemon offline at %s, falling back to Heuristic engine.", settings.OLLAMA_BASE_URL)

    return HeuristicLLMProvider()
