import {Injectable} from "@angular/core";

@Injectable()
export default class AppValues {
  public static appTitle: string = 'Kamu Web';
  public static appLogo: string = 'assets/icons/kamu-logo.svg';

  public static capitalizeFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}
