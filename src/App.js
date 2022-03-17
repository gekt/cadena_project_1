import abi from "./contracts/chat.json";
import {ethers, utils} from "ethers";
import {useEffect, useRef, useState} from "react";
import "./App.scss";

export default () => {

  const contractAddress = "0x49f1b34aBc17DbD9c1CE8bdBDC5cf2cE86D2824D";

  const [hasWallet, setHasWallet] = useState(false);
  const [account, setAccount] = useState(null);
  const [allMessages, setAllMessages] = useState([]);
  const [messageText,setMessageText] = useState("");
  const [isOwner,setIsOwner] = useState(null);
  const sendMessageInput = useRef();
  const messageBox = useRef();


  useEffect(() => {
    if (window.ethereum){


      connectWallet();
      getAllMessages();
      getChatOwner();
      registerListener();


      setHasWallet(true);


      window.ethereum.on("accountsChanged", accounts => {
        if (accounts.length === 0){
          setAccount(null);
        }else{
          setAccount(accounts[0]);
        }
      });


      return () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress,abi,signer);

        contract.removeAllListeners();
      }

    }

  }, [account]);


  const connectWallet = async () => {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    setAccount(accounts[0]);

    if (accounts.length > 0){
      setAccount(accounts[0]);
    }
  }

  const getAllMessages = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress,abi,signer);

    const messagesCount = await contract.messageCount();
    let allMessages = [];

    for (let i = 0; i < messagesCount; i++){
      const data = await contract.getMessage(i);
      allMessages.push({index:data._index,from:data._from,message:data._message})
    }

    setAllMessages(allMessages);

    console.log("count mess",allMessages.length);
  }


  const sendMessage = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress,abi,signer);

    try {
      await contract.addMessage(utils.formatBytes32String(messageText));
      sendMessageInput.current.value = "";
    }catch (e){
      console.log("error",e);
    }
  }

  const deleteMessage = async (index) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress,abi,signer);

    try{
        await contract.deleteMessage(index);
    }catch (e){
      console.log("error",e);
    }
  }

  const getChatOwner = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress,abi,signer);

    let owner = await contract.chatOwner();

    const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });

    if (owner.toLowerCase() === account.toLowerCase()){
      setIsOwner(true);
    }
  }


  const registerListener = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress,abi,signer);

    contract.on("MessageAdded",async (index,from,message) => {

      console.log("trigger listener")

      getAllMessages();

      console.log("added")
      let newData = allMessages;
      newData.push({index,from,message});
      setAllMessages(newData);


    });
  }


  return (
        <div>
          <div ref={messageBox} id="messageBox" className="messageBox">
            {allMessages.map((message) => (
                <>
                  <div key={message.index} id="displayedMessage">
                    {message.from}: {utils.parseBytes32String(message.message)}
                    {isOwner && (
                        <button onClick={() => deleteMessage(message.index)}>DEL</button>
                    )}
                  </div>
                </>
            ))}
          </div>
          <div className="inputBox">
            <input ref={sendMessageInput} onChange={(text) => setMessageText(text.target.value)} placeholder="32 chars max..." type="text" maxLength={32}/>
            <button onClick={sendMessage}>Envoyer</button>

          </div>

          <p>Are you the owner ? {isOwner ? "Yes" : "No"}</p>
          <p>Your message will be displayed when the event catch him</p>
        </div>
  )
}
