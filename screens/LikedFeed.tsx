import React, { useEffect, useRef, useState } from "react";
import { PublishedPollWithID, getLikedPollsForUser } from "../firebase";
import { FlatList, View, Animated, Text, Pressable } from "react-native";
import LoadingScreen from "../components/LoadingScreen";
import Spacer from "../components/Spacer";
import { PublishedPollPreview } from "./ExploreFeed";

const EmptyList = ({
  setLoading,
}: {
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const growthRef = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(growthRef, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Pressable
      onPress={() => setLoading(true)}
      style={{
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Animated.Text
        style={{
          fontSize: 30,
          color: "#507DBC",
          textAlign: "center",
          fontFamily: "Lato_400Regular",
          transform: [{ scale: growthRef }],
        }}
      >
        Like some polls to get started!
      </Animated.Text>
    </Pressable>
  );
};

export default function LikedFeed({ route }) {
  const [likedPolls, setLikedPolls] = useState<PublishedPollWithID[]>();
  const [loading, setLoading] = useState(true);

  const { userData } = route.params;
  const userID = userData.id;

  useEffect(() => {
    if (loading)
      getLikedPollsForUser(userID).then((result) => {
        setLikedPolls(result);
        setLoading(false);
      });
  }, [loading]);

  return (
    <View
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#FFF",
        justifyContent: "center",
        alignItems: "center",
        paddingLeft: 20,
        paddingRight: 20,
      }}
    >
      <Spacer width="100%" height={20} />
      {!loading && likedPolls.length !== 0 && (
        <Text
          style={{
            fontFamily: "Lato_400Regular",
            fontSize: 30,
            color: "#507DBC",
          }}
        >
          Liked Polls
        </Text>
      )}
      <Spacer width="100%" height={37} />
      {loading ? (
        <LoadingScreen color="#507DBC" />
      ) : likedPolls.length === 0 ? (
        <EmptyList setLoading={setLoading} />
      ) : (
        <FlatList
          data={likedPolls}
          showsVerticalScrollIndicator={false}
          style={{ width: "100%", height: "100%" }}
          renderItem={({ item, index }) => (
            <PublishedPollPreview
              last={index === likedPolls.length - 1}
              poll={item}
              triggerRefresh={setLoading}
              userID={userID}
            />
          )}
        />
      )}
      <Spacer width="100%" height={20} />
    </View>
  );
}
