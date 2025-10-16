declare module '@expo/vector-icons' {
  export const AntDesign: any;
  export const Entypo: any;
  export const EvilIcons: any;
  export const Feather: any;
  export const FontAwesome: any;
  export const FontAwesome5: any;
  export const Fontisto: any;
  export const Foundation: any;
  export const Ionicons: any;
  export const MaterialCommunityIcons: any;
  export const MaterialIcons: any;
  export const Octicons: any;
  export const SimpleLineIcons: any;
  export const Zocial: any;
}

declare module '@expo/vector-icons/*' {
  const content: any;
  export default content;
}