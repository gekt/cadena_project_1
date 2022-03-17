// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.12;



contract MyChat {

    address public chatOwner;
    string public chatName;
    uint public messageCount = 0;

    mapping(uint => dataMessage) public customerMessage;


    constructor(){
        chatOwner = msg.sender;
    }

    struct dataMessage {
        address _from;
        bytes32 _message;
        uint _index;
    }


    event MessageAdded(uint index, address sender, bytes32 message);


    function addMessage(bytes32 _sendMessage) public  {
        require(_sendMessage.length != 0 , "You have to set a message !");

        dataMessage memory newMessage;
        newMessage._from = msg.sender;
        newMessage._message = _sendMessage;
        newMessage._index = messageCount;

        customerMessage[messageCount] = newMessage;

        emit MessageAdded(messageCount, msg.sender, _sendMessage);

        messageCount += 1;
    }

    function getMessage(uint index) public view returns (dataMessage memory) {
        return customerMessage[index];
    }

    function deleteMessage(uint index) public {
        require(msg.sender == chatOwner, "You have to be the owner !");
        delete customerMessage[index];
        messageCount -= 1;
    }


}
