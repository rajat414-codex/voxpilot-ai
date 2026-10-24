import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from intent_engine import IntentEngine

engine = IntentEngine()

tests = [
    "open youtube and play chikni chameli",
    "bhai youtube pe chikni chameli chalao",
    "youtube par arijit singh ke gaane sunao",
    "gmail pe email compose karo",
    "calculator kholo",
    "whatsapp web kholo",
    "weather kaisa hai"
]

print("=== NLP Intent Parsing Test ===")
for t in tests:
    res = engine.parse_intent(t)
    print(f"Input:    '{t}'")
    print(f"Action:   {res['action']} ({res['platform']})")
    print(f"Params:   {res['parameters']}")
    print(f"Response: '{res['response_text']}'")
    print("-" * 50)
