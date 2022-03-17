import abi from "./contracts/abi.json";
import {ethers, utils} from "ethers";
import {useEffect, useRef, useState} from "react";
import "./App.scss";

export default () => {

    const contractAddress = "0xb41a007f1d186a4c55fbe784a239a0a1ef78770c";

    const [hasWallet, setHasWallet] = useState(false);
    const [account, setAccount] = useState(null);
    const [allMessages, setAllMessages] = useState([]);
    const [messageText, setMessageText] = useState("");
    const [isOwner, setIsOwner] = useState(null);
    const [ownerAddress, setOwnerAddress] = useState(null);
    const sendMessageInput = useRef();
    const messageBox = useRef();
    const [lastMessageReceived, setLastMessageReceived] = useState(null);
    const [loadingMessage, setLoadingMessage] = useState(true);


    useEffect(() => {
        if (window.ethereum) {



            connectWallet();
            getAllMessages();
            getChatOwner();

            if (account){
                registerListener();
            }



            setHasWallet(true);


            window.ethereum.on("accountsChanged", accounts => {
                if (accounts.length === 0) {
                    setAccount(null);
                } else {
                    setAccount(accounts[0]);
                }
            });


            return () => {
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const contract = new ethers.Contract(contractAddress, abi, signer);

                contract.removeAllListeners();
            }

        }

    }, [account]);


    const connectWallet = async () => {
        const accounts = await window.ethereum.request({method: 'eth_requestAccounts'});
        setAccount(accounts[0]);

        if (accounts.length > 0) {
            setAccount(accounts[0]);
        }
    }

    const getAllMessages = async () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer);

        const messagesCount = await contract.messageCount();
        let arrMessages = [];

        setAllMessages([]);

        setLoadingMessage(true);
        for (let i = 0; i < messagesCount; i++) {
            const data = await contract.getMessage(i);
            arrMessages.push({index: data._index, from: data._from, message: data._message})
        }

        setAllMessages(arrMessages);
        setLoadingMessage(false);

        console.log("count mess", arrMessages.length);
    }


    const sendMessage = async () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer);

        try {
            await contract.addMessage(utils.formatBytes32String(messageText));
            sendMessageInput.current.value = "";
        } catch (e) {
            console.log("error", e);
        }
    }

    const deleteMessage = async (index) => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer);

        try {
            await contract.deleteMessage(index);
        } catch (e) {
            console.log("error", e);
        }
    }

    const getChatOwner = async () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer);

        let owner = await contract.chatOwner();
        setOwnerAddress(owner);

        const [account] = await window.ethereum.request({method: 'eth_requestAccounts'});

        if (owner.toLowerCase() === account.toLowerCase()) {
            setIsOwner(true);
        }
    }


    const registerListener = async () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer);

        contract.on("MessageAdded", async (index, from, message) => {

            console.log("New messages")

            getAllMessages();


        });
    }


    return (
        <>
            {account && hasWallet && (
                <div>
                    <div ref={messageBox} id="messageBox" className="messageBox">
                        {!loadingMessage && allMessages.map((message) => (
                            <div key={message.index} id="displayedMessage">
                                ({parseInt(message.index)}) {message.from}:  {utils.parseBytes32String(message.message)}
                                {isOwner && (
                                    <button onClick={() => deleteMessage(message.index)}>DEL</button>
                                )}
                            </div>
                        ))}
                        {loadingMessage && (
                            <p>loading...</p>
                        )}
                    </div>
                    <div className="inputBox">
                        <input ref={sendMessageInput} onChange={(text) => setMessageText(text.target.value)}
                               placeholder="32 chars max..." type="text" maxLength={32}/>
                        <button onClick={sendMessage}>Envoyer</button>

                    </div>

                    <p>Are you the owner ? {isOwner ? "Yes" : "No"}</p>
                    <p>Owner address: {ownerAddress}</p>
                    <p>Your message will be displayed when the event catch him.</p>
                    <p>(may be long depend if the network is overcharged)</p>
                </div>
            )}

            {!account && (
                <>
                    <p>You have to connect you wallet !</p>
                    <div className="connectBox">
                        <button onClick={connectWallet}>Connect wallet</button>
                    </div>
                </>
            )}

            {!hasWallet && (
                <p>You must have Metamask wallet</p>
            )}
        </>
    )
}
