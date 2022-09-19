import React, { useEffect, useState } from "react";
import { Image, View, ActivityIndicator, ImageResizeMode } from "react-native";
import * as FileSystem from "expo-file-system";

interface FastImageProps {
  pollID: string;
  uri: string;
  style: any;
  resizeMode?: ImageResizeMode;
  blurRadius?: number;
  borderRadius?: number;
}

async function findImageInCache(uri: string) {
  try {
    let info = await FileSystem.getInfoAsync(uri);
    return { ...info, err: false };
  } catch (error) {
    return {
      exists: false,
      err: true,
      msg: error,
    };
  }
}

async function cacheImage(
  uri: string,
  cacheUri: string,
  callback: { (): void; (data: FileSystem.DownloadProgressData): void }
) {
  try {
    const downloadImage = FileSystem.createDownloadResumable(
      uri,
      cacheUri,
      {},
      callback
    );
    const downloaded = await downloadImage.downloadAsync();
    return {
      cached: true,
      err: false,
      path: downloaded.uri,
    };
  } catch (error) {
    return {
      cached: false,
      err: true,
      msg: error,
    };
  }
}

export default function FastImage({
  pollID,
  uri,
  style,
  resizeMode,
  blurRadius,
  borderRadius,
}: FastImageProps) {
  const [imgUri, setUri] = useState("");

  useEffect(() => {
    async function loadImg() {
      const cacheFileUri = `${FileSystem.cacheDirectory}${pollID}`;
      let imgXistsInCache = await findImageInCache(cacheFileUri);
      if (imgXistsInCache.exists) {
        setUri(cacheFileUri);
      } else {
        let cached = await cacheImage(uri, cacheFileUri, () => {});
        if (cached.cached) {
          setUri(cached.path);
        }
      }
    }
    loadImg();
  }, []);
  return (
    <>
      {imgUri ? (
        <Image
          source={{ uri: imgUri }}
          style={style}
          borderRadius={borderRadius ?? 5}
          {...(resizeMode && { resizeMode })}
          {...(blurRadius && { blurRadius })}
        />
      ) : (
        <View
          style={{
            ...style,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 5,
            position: "absolute",
            width: "100%",
            height: "100%",
            paddingTop: 25,
          }}
        >
          <ActivityIndicator size={50} />
        </View>
      )}
    </>
  );
}
