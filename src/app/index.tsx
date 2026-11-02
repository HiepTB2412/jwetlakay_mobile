import { StyleSheet, Text } from "react-native";

import { Screen } from "@/components/screen";

export default function Index() {
  return (
    <Screen>
      <Text>Edit src/app/index.tsx to edit this screen.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
