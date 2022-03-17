import abi from "./contracts/abi.json";
import {ethers, utils} from "ethers";
import {useEffect, useRef, useState} from "react";
import "./App.scss";

export default () => {

    const contractAddress = "0x75396df1102b5ed9a658628422bf8ac34d10dbd5";

    const [hasWallet, setHasWallet] = useState(false);
    const [account, setAccount] = useState(null);
    const [messageText, setMessageText] = useState("");
    const [isOwner, setIsOwner] = useState(null);
    const [ownerAddress, setOwnerAddress] = useState(null);
    const sendMessageInput = useRef();

    const loadingMessage = useRef(true);
    const [isLoading, setIsLoading] = useState(true);

    const [displayedMessages,setDisplayedMessages] = useState([]);
    const allMessages = useRef([]);


    useEffect(() => {
        if (window.ethereum) {

            connectWallet();

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

    }, []);

    useEffect(() => {
        if (account){
            getAllMessages();
            getChatOwner();
            registerListener();
        }
    }, [account])



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

        setLoadingMessages(true);

        for (let i = 0; i < messagesCount; i++) {
            const data = await contract.getMessage(i);
            arrMessages.push({index: data._index, from: data._from, message: data._message})
        }

        setAllMessages(arrMessages);
        setLoadingMessages(false);
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


    const registerListener = () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, abi, signer);

        contract.on("MessageAdded", (index, from, message) => {
            if (!loadingMessage.current){
                console.log("ADD NEW MESSAGE")
                let newData = allMessages.current;
                newData.push({index,from,message})
                setAllMessages(newData);
            }
        });

        contract.on("MessageDeleted", (index) => {
            console.log("MESSAGE DELETED");
           let intIndex = parseInt(index);

           let tempData = displayedMessages.splice(intIndex,1);
           setAllMessages(tempData);
        });
    }

    const setAllMessages = (data) => {
        let temp = [...data];
        setDisplayedMessages(temp);
        allMessages.current = data;
    }

    const setLoadingMessages = (status) => {
        setIsLoading(status);
        loadingMessage.current = status;
    }


    return (
        <>
            {account && hasWallet && (
                <div>
                    <div id="messageBox" className="messageBox">
                        {!isLoading && displayedMessages.map((message) => (
                            <div key={message.index} id="displayedMessage">
                                {message.from}:  {utils.parseBytes32String(message.message)}
                                {isOwner && (
                                    <button onClick={() => deleteMessage(message.index)}>DEL</button>
                                )}
                            </div>
                        ))}
                        {isLoading && (
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

            {displayedMessages.length}
        </>
    )
}
