import React, { useEffect, useState, useRef } from "react";
import "./App.css";
import MicRecorder from "mic-recorder-to-mp3";
import axios from "axios";
import micIcon from "./icons/mic.png";
import stopIcon from "./icons/stop.png";

const Mp3Recorder = new MicRecorder({ bitRate: 128 });

function App() {
  const intervalRef = useRef(null);
  const [audioDetails, setAudioDetails] = useState({
    isRecording: false,
    blobURL: "",
    isBlocked: false,
  });
  const [infor, setInfor] = useState("");

  const start = () => {
    if (audioDetails.isBlocked) {
      setInfor("Permission Denied");
    } else {
      Mp3Recorder.start()
        .then(() => {
          setInfor("Recording...");
          setAudioDetails((audioDetails) => {
            const tmpAudioDetails = { ...audioDetails, isRecording: true };
            return tmpAudioDetails;
          });
        })
        .catch((e) => {
          setInfor(`ERROR ${e.message}`);
          console.error(e);
        });
    }
  };

  useEffect(() => {
    navigator.mediaDevices.getUserMedia(
      { audio: true },
      () => {
        console.log("Permission Granted");
        setAudioDetails((audioDetails) => {
          const tmpAudioDetails = { ...audioDetails, isBlocked: false };
          return tmpAudioDetails;
        });
      },
      () => {
        console.log("Permission Denied");
        setInfor("This browser is not supported");
        setAudioDetails((audioDetails) => {
          const tmpAudioDetails = { ...audioDetails, isBlocked: true };
          return tmpAudioDetails;
        });
      }
    );
  }, []);

  const stop = () => {
    Mp3Recorder.stop()
      .getMp3()
      .then(async ([buffer, blob]) => {
        const blobURL = URL.createObjectURL(blob);
        setInfor(`Uploading audio to server...`);
        setAudioDetails((audioDetails) => {
          const tmpAudioDetails = {
            ...audioDetails,
            blobURL: blobURL,
            isRecording: false,
          };
          return tmpAudioDetails;
        });

        const formData = new FormData();
        formData.append("file", blob, `questionId-${new Date().getTime()}.mp3`);
        const response = await axios.post("/aws/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        setInfor(`Transcribing ...`);

        intervalRef.current = setInterval(async () => {
          const res = await axios.get(
            `/aws/transcription/${response.data.jobName}`
          );
          if (res.data.ok) {
            clearInterval(intervalRef.current);
            setInfor(res.data.transcription.transcripts[0].transcript);
          }
          console.log("res", res);
        }, 5000);
      })
      .catch((e) => console.log(e));
  };
  return (
    <div className="App">
      {audioDetails.file && <audio src={audioDetails.file} controls={true} />}
      <div style={{ marginBottom: 10 }}>
        {!audioDetails.file && !audioDetails.isRecording
          ? "Click to start recording"
          : audioDetails.isRecording
          ? "Click to stop recording"
          : ""}
      </div>
      <div style={{ marginBottom: 10 }}>{infor}</div>
      <div>
        {!audioDetails.isRecording && (
          <div onClick={start} style={{ cursor: "pointer" }}>
            <img src={micIcon} alt="mic" style={{ width: 40, height: 55 }} />
          </div>
        )}
        {audioDetails.isRecording && (
          <div onClick={stop} style={{ cursor: "pointer" }}>
            <img
              src={stopIcon}
              alt="stop record"
              style={{ width: 50, height: 50 }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
