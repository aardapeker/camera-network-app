import React from "react"

import { transcribeAudio } from "~/functions/audio/transcribe_audio"

export type SpeechToTextStatus = "idle" | "recording" | "transcribing"

interface UseSpeechToTextOptions {
  onResult: (text: string) => void
  onError?: (error: Error) => void
  language?: string
}

export function useSpeechToText({ onResult, onError, language }: UseSpeechToTextOptions) {
  const [status, setStatus] = React.useState<SpeechToTextStatus>("idle")
  const recorderRef = React.useRef<MediaRecorder | null>(null)
  const chunksRef = React.useRef<Blob[]>([])

  const start = React.useCallback(async () => {
    if (status !== "idle") return
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      onError?.(new Error("NOT_SUPPORTED"))
      return
    }

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      onError?.(new Error("PERMISSION_DENIED"))
      return
    }

    const recorder = new MediaRecorder(stream)
    chunksRef.current = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop())
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" })
      chunksRef.current = []

      if (blob.size === 0) {
        setStatus("idle")
        return
      }

      setStatus("transcribing")
      transcribeAudio(blob, language)
        .then((text) => {
          if (text) onResult(text)
        })
        .catch((err) => {
          onError?.(err instanceof Error ? err : new Error(String(err)))
        })
        .finally(() => setStatus("idle"))
    }

    recorderRef.current = recorder
    recorder.start()
    setStatus("recording")
  }, [status, onResult, onError, language])

  const stop = React.useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop()
    }
  }, [])

  const toggle = React.useCallback(() => {
    if (status === "idle") void start()
    else if (status === "recording") stop()
  }, [status, start, stop])

  React.useEffect(() => () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop()
    }
  }, [])

  return { status, toggle }
}
