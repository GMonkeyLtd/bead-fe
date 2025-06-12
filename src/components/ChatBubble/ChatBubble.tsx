import React from 'react';
import './ChatBubble.scss';
import { View } from '@tarojs/components';

interface ChatBubbleProps {
  message: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  console.log(message, 'message');
  return (
    <View className="chat-bubble">
      <View className="chat-message">{message}</View>
    </View>
  );
};

export default ChatBubble;