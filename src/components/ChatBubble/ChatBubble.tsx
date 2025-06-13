import React from 'react';
import './ChatBubble.scss';
import { View } from '@tarojs/components';

interface ChatBubbleProps {
  message: string;
  style?: React.CSSProperties;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, style }) => {
  console.log(message, 'message');
  return (
    <View className="chat-bubble" >
      <View className="chat-bubble-content" style={{...style}}>
        {message}
      </View>
    </View>
  );
};

export default ChatBubble;