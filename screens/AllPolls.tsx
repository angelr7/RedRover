import { View, Text, FlatList } from "react-native";
import Spacer from "../components/Spacer";
import { useEffect, useState } from "react";
import { PublishedPollWithID, getAllUserPolls } from "../firebase";
import LoadingScreen from "../components/LoadingScreen";
import { PublishedPollPreview } from "./CreatePolls2";

export default function AllPolls({ route }) {
  const [loading, setLoading] = useState(true);
  const [allPolls, setAllPolls] = useState<PublishedPollWithID[]>([]);
  const { userData } = route.params;

  useEffect(() => {
    if (loading)
      getAllUserPolls(userData.id).then((polls) => {
        setAllPolls(
          polls.sort((a, b) => parseInt(b.createdAt) - parseInt(a.createdAt))
        );
        setLoading(false);
      });
  }, [loading]);

  if (loading) return <LoadingScreen color="#853b30" />;

  return (
    <View
      style={{
        width: "100%",
        height: "100%",
        padding: 20,
        paddingBottom: 0,
        backgroundColor: "#FFF",
      }}
    >
      <Text
        style={{
          alignSelf: "center",
          fontFamily: "Lato_400Regular",
          fontSize: 30,
          color: "#853b30",
        }}
      >
        Your Polls
      </Text>
      <Spacer width="100%" height={20} />
      <FlatList
        style={{ width: "100%", flex: 1 }}
        data={allPolls}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const last = index === allPolls.length - 1;
          return (
            <>
              <PublishedPollPreview poll={item} last={last} alt={true} />
              {last && <Spacer width="100%" height={40} />}
            </>
          );
        }}
      />
    </View>
  );
}
