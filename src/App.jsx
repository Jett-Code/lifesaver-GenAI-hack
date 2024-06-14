import { useState, useEffect } from 'react';
import styles from './app.module.css';
import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import useClipboard from "react-use-clipboard";
import { BiSolidCopyAlt } from "react-icons/bi";
import { BsFillMicFill } from "react-icons/bs";
import { BsFillMicMuteFill } from "react-icons/bs";
import axios from 'axios';


const loc_api = import.meta.env.VITE_OPENAI_API_KEY;


// Function to translate text using OpenAI API
const translateToEnglish = async (text) => {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/completions',
      {
        model: "gpt-3.5-turbo-instruct", 
        prompt: `You are a knowledgeable health advisor. A person has come to you seeking advice on how to manage common health symptoms with home remedies and medicines. They have provided a text in their native language describing their symptoms. Your task is to:

        Translate the following text to English, detecting its original language: "${text}".
        Suggest a medicine to cure the disease. Ensure the medicine is available in remote areas of India and is affordable.
        Suggest a home remedy if possible.
        keep it precise and to the point. The name of medicine is enough and name of home remedy if possible.`,
        max_tokens: 500,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loc_api}`
        },
      }
    );
    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Error translating text with OpenAI:', error);
    return 'Translation error';
  }
};

const App = () => {
  const [copyTxt, setCopyTxt] = useState("");
  const [isCopied, setCopied] = useClipboard(copyTxt);
  const [responseText, setResponseText] = useState("");
  const [medicine, setMedicine] = useState("");
  const [showMedicineButton, setShowMedicineButton] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const startListening = () => {
    setOrderPlaced(false);
    SpeechRecognition.startListening({ continuous: true, language: 'en-IN' });
  }
  
  const stopListening = async () => {
    SpeechRecognition.stopListening();
    if (finalTranscript) {
      try {
        const response = await translateToEnglish(finalTranscript);
        setResponseText(response);

        // Extract the medicine name from the response
        const medicineMatch = response.match(/(Medicine|Medicine suggestion|Suggested medicine): (.*?)(\.|\n|$)/);
        if (medicineMatch && medicineMatch[1]) {
          setMedicine(medicineMatch[1]);
          setShowMedicineButton(true);
        }
        setCopyTxt(response);
      } catch (error) {
        console.error("Error translating text:", error);
      }
    }
  };

  const { transcript, browserSupportsSpeechRecognition } = useSpeechRecognition();
  const [finalTranscript, setFinalTranscript] = useState("");

  useEffect(() => {
    if (transcript) {
      setFinalTranscript(transcript);
    }
  }, [transcript]);

  if (!browserSupportsSpeechRecognition) {
    return alert('No browser support for speech recognition');
  }

  

  return (
    <div className={styles.container}>
      <h1>lifesaver</h1>
      <div className={styles.mainContent} onClick={() => setCopyTxt(responseText)}>
        {responseText}
      </div>
      
      <div className={styles.btn}>
        <button onClick={startListening}><BsFillMicFill /> Start</button>
        <button onClick={stopListening}><BsFillMicMuteFill /> Stop</button>
        <button onClick={setCopied}>
          <BiSolidCopyAlt /> {isCopied ? " Copied" : " Copy to clipboard"}
        </button>
      </div>
      <div className={styles.medicine}>
    {showMedicineButton && <button onClick={() => setOrderPlaced(true)}>checkout medicine</button>}
    </div>
    <div className={styles.order}>
    {orderPlaced && <p>Order Placed!</p>}
    </div>
    </div>
    
  );
};

export default App;
