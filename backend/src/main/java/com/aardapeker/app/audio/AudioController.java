package com.aardapeker.app.audio;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/audio")
public class AudioController {

    private final AudioTranscriptionService transcriptionService;

    public AudioController(AudioTranscriptionService transcriptionService) {
        this.transcriptionService = transcriptionService;
    }

    @PostMapping(value = "/transcribe", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TranscriptionResponse> transcribe(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "language", required = false) String language) {
        String text = transcriptionService.transcribe(file, language);
        return ResponseEntity.ok(new TranscriptionResponse(text));
    }
}
