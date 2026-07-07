// Expo 웹 변형 컴포넌트의 CSS import 타입 선언 (템플릿 누락분 보완)
declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "*.css";
