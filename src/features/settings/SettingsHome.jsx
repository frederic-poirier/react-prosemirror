import { NavigationList, NavigationListItem } from "../../component/settings";

export default function SettingsHome() {
  return (
    <>
      <h1>Settings</h1>
      <NavigationList>
        <NavigationListItem link='plugins' />
        <NavigationListItem link='appearance' />
        <NavigationListItem link='hotkeys' />
      </NavigationList>

    </>
  );
}
