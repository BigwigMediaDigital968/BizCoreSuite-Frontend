// src/features/dialer/components/AudioDeviceSelector.tsx

import React, { useEffect, useState } from "react";

interface AudioDeviceSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMicId?: string;
  selectedSpeakerId?: string;
  onSelectSpeaker?: (deviceId: string) => void;
  onSelectMicrophone?: (deviceId: string) => void;
}

const AudioDeviceSelector: React.FC<AudioDeviceSelectorProps> = ({
  isOpen,
  onClose,
  selectedMicId,
  selectedSpeakerId,
  onSelectSpeaker,
  onSelectMicrophone,
}) => {
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState(selectedMicId || "");
  const [selectedSpeaker, setSelectedSpeaker] = useState(selectedSpeakerId || "");

  useEffect(() => {
    if (!isOpen) return;

    const loadDevices = async () => {
      try {
        // Request temporary stream to ensure labels are accessible
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const devices = await navigator.mediaDevices.enumerateDevices();

        console.log("devices", devices)

        // Release media stream tracks immediately after enumerating
        stream.getTracks().forEach((track) => track.stop());

        const inputs = devices.filter((d) => d.kind === "audioinput");
        const outputs = devices.filter((d) => d.kind === "audiooutput");

        setAudioInputs(inputs);
        setAudioOutputs(outputs);

        if (!selectedMic && inputs.length > 0) {
          const defaultMic = inputs[0].deviceId;
          setSelectedMic(defaultMic);
          onSelectMicrophone?.(defaultMic);
        }

        if (!selectedSpeaker && outputs.length > 0) {
          const defaultSpeaker = outputs[0].deviceId;
          setSelectedSpeaker(defaultSpeaker);
          onSelectSpeaker?.(defaultSpeaker);
        }
      } catch (error) {
        console.warn("[AudioDevice] Failed to access media devices:", error);
      }
    };

    loadDevices();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMicChange = (deviceId: string) => {
    setSelectedMic(deviceId);
    onSelectMicrophone?.(deviceId);
  };

  const handleSpeakerChange = (deviceId: string) => {
    setSelectedSpeaker(deviceId);
    onSelectSpeaker?.(deviceId);
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 z-50 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-outline-variant/10 pb-3">
        <div>
          <h3 className="text-sm font-bold text-on-surface">Audio Settings</h3>
          <p className="text-[11px] text-on-surface-variant">
            Select your input and output devices
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      <div className="space-y-4">
        {/* Microphone */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-on-surface">
            <span className="material-symbols-outlined text-base text-primary">mic</span>
            Microphone
          </label>

          <select
            value={selectedMic}
            onChange={(e) => handleMicChange(e.target.value)}
            className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2.5 text-xs font-medium text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          >
            {audioInputs.length === 0 ? (
              <option value="">No microphone detected</option>
            ) : (
              audioInputs.map((device, idx) => (
                <option key={device.deviceId || `mic-${idx}`} value={device.deviceId}>
                  {device.label || `Microphone ${idx + 1}`}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Speaker */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-on-surface">
            <span className="material-symbols-outlined text-base text-primary">volume_up</span>
            Speaker
          </label>

          <select
            value={selectedSpeaker}
            onChange={(e) => handleSpeakerChange(e.target.value)}
            className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-3 py-2.5 text-xs font-medium text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          >
            {audioOutputs.length === 0 ? (
              <option value="">Default Speaker</option>
            ) : (
              audioOutputs.map((device, idx) => (
                <option key={device.deviceId || `spk-${idx}`} value={device.deviceId}>
                  {device.label || `Speaker ${idx + 1}`}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="mt-4 w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-on-primary hover:bg-primary/90 transition-all shadow-sm active:scale-[0.98]"
      >
        Done
      </button>
    </div>
  );
};

export default AudioDeviceSelector;