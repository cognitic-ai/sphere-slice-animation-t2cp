import { View } from "react-native";
import SphereSceneThreeJS from "@/components/sphere-scene-threejs";

export default function IndexRoute() {
  return (
    <View style={{ flex: 1 }}>
      <SphereSceneThreeJS />
    </View>
  );
}
