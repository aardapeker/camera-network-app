package com.aardapeker.app.audio;

import org.springframework.web.multipart.MultipartFile;

public interface AudioTranscriptionService {
    String transcribe(MultipartFile file, String language);
}
