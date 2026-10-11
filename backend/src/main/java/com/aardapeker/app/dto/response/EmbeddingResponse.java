package com.aardapeker.app.dto.response;

public record EmbeddingResponse(
    String text,
    float[] embedding,
    int dimensions
) {
    public static EmbeddingResponse of(String text, float[] embedding) {
        return new EmbeddingResponse(text, embedding, embedding.length);
    }
}
