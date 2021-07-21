import axios from 'axios';
import { ActionType } from '../redux/action-type';
import { store } from '../redux/store';
import ErrorHandlerUiUtils from './ErrorHandlerUIUtils';

export default class LoginUtils {
    public static setUsersCache = (token: string, username: string) => {
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("username", username);
    }

    public static routeUserToMainPage = (comp: any, res: any) => {
        if (res.userType === "Admin") {
            comp.props.history.push('/admin');
        }
        else if (res.userType === "Client") {
            comp.props.history.push('/client');
        }
    }

    public static setTokenToAxiosHeaders = (token: string) => {
        axios.defaults.headers.common['Authorization'] = "Bearer " + token;
    }

    public static responseSuccessfulGoogleLogin = async (response: any, comp: any) => {
        try {
            let serverResponse = await axios.post(comp.URL + "users/google-login", { tokenId: response.tokenId });
            const serverResponseData = serverResponse.data;
            let userDetails = {
                token: serverResponseData.token,
                username: serverResponseData.username
            }

            store.dispatch({ type: ActionType.updateIsUserLoggedIn });

            LoginUtils.setUsersCache(userDetails.token, userDetails.username);

            LoginUtils.setTokenToAxiosHeaders(userDetails.token);

            store.dispatch({ type: ActionType.registerToSocketsIO, payload: userDetails.token });

            LoginUtils.routeUserToMainPage(comp, serverResponseData);
        }
        catch (error) {
            ErrorHandlerUiUtils.handleErrorsOnUi(error, comp);
        }
    }

    public static responseFailureGoogleLogin = (response: any) => {
        console.log(response);
    }
}