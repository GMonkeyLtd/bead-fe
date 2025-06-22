import React from "react";
import { View, Text, ScrollView } from "@tarojs/components";
import "./index.scss";

interface Tag {
  id: string;
  title: string;
}

interface TagListProps {
  tags: Tag[];
  onTagSelect?: (tag: Tag) => void;
}

const TagList: React.FC<TagListProps> = ({ tags, onTagSelect }) => {
  const handleTagClick = (tag: Tag) => {
    onTagSelect?.(tag);
  };

  return (
    <View className="tag-list">
      <ScrollView
        className="tags-scroll-view"
        scrollX
        showScrollbar={false}
        enhanced
        bounces={false}
        scrollWithAnimation
      >
        <View className="tags-container">
          {tags.map((tag) => (
            <View
              key={tag.id}
              className="tag-item"
              onClick={(e) => {
                e.stopPropagation();
                handleTagClick(tag);
                e.preventDefault();
              }}
            >
              <Text className="tag-title">{tag.title}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default TagList;
