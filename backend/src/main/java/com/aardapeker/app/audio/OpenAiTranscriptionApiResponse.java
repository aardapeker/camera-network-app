package com.aardapeker.app.audio;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record OpenAiTranscriptionApiResponse(String text) {
}
