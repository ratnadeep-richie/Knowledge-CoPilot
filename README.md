# Knowledge-CoPilot
**Knowledge Copilot** is an AI-powered assistant that uses RAG pipelines to retrieve information from documents and generate accurate answers. It enables fast knowledge discovery through a simple chat interface.


A document Q&A assistant powered by a 6-stage RAG pipeline and the Claude API. Upload any text document, ask a question, and get a grounded answer with source citations and a faithfulness score.
All retrieval runs in-browser (no backend). Only generation and evaluation hit the API.

How It Works
Each query passes through six stages, visible live in the sidebar:
#StageWhat happens1Query RewritingClaude rephrases your query for better retrieval precision2HyDE GenerationClaude writes a hypothetical ideal answer; its tokens expand the retrieval signal3Hybrid RetrievalBM25 sparse scoring + dense cosine similarity rank all chunks; top 8 selected4RerankingA cross-encoder rescores the 8 candidates; top 5 passed to generation5Grounded GenerationClaude answers using only retrieved context, citing sources as [1] [2]6Faithfulness CheckClaude scores its own answer 0–100% based on support from the retrieved chunks
Documents are semantically chunked on paragraph and sentence boundaries (~600 chars/chunk), preserving meaning better than fixed-size windows.


