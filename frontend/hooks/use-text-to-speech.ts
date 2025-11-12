"use client"

import { useState, useEffect, useCallback } from "react"

interface UseTTSReturn {
  isSpeaking: boolean
  currentQuestionId: number | null
  speak: (text: string, questionId?: number) => void
  stop: () => void
  isSupported: boolean
}

export function useTextToSpeech(): UseTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Check if browser supports Speech Synthesis API
    setIsSupported(typeof window !== "undefined" && "speechSynthesis" in window)
  }, [])

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      setCurrentQuestionId(null)
    }
  }, [isSupported])

  const speak = useCallback(
    (text: string, questionId?: number) => {
      if (!isSupported) {
        console.warn("Text-to-speech is not supported in this browser")
        return
      }

      // Stop any ongoing speech
      stop()

      // Create new utterance
      const utterance = new SpeechSynthesisUtterance(text)

      // Configure voice (prefer English voices)
      const voices = window.speechSynthesis.getVoices()
      const englishVoice = voices.find(
        (voice) => voice.lang.startsWith("en-") && (voice.name.includes("Google") || voice.name.includes("Microsoft")),
      )
      if (englishVoice) {
        utterance.voice = englishVoice
      }

      // Configure speech parameters
      utterance.rate = 0.9 // Slightly slower for clarity
      utterance.pitch = 1.0
      utterance.volume = 1.0
      utterance.lang = "en-US"

      // Event handlers
      utterance.onstart = () => {
        setIsSpeaking(true)
        if (questionId !== undefined) {
          setCurrentQuestionId(questionId)
        }
      }

      utterance.onend = () => {
        setIsSpeaking(false)
        setCurrentQuestionId(null)
      }

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event)
        setIsSpeaking(false)
        setCurrentQuestionId(null)
      }

      // Start speaking
      window.speechSynthesis.speak(utterance)
    },
    [isSupported, stop],
  )

  return {
    isSpeaking,
    currentQuestionId,
    speak,
    stop,
    isSupported,
  }
}
