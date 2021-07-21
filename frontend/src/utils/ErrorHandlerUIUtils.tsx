import { store } from '../redux/store';
import { ActionType } from '../redux/action-type';

export default class ErrorHandlerUiUtils {
    public static handleErrorsOnUi(error: any, comp: any) {
        if (error.response !== undefined) {
            //this block handles the 404 code which comes back from the Axios > for example, when the path is wrong
            if (error.response.status === 404) {
                console.log(error.message);
                this.showSnackbarWithErrorStatus(error.response.status, error.message, comp);
                this.hideSnackbarAndSendToPageNotFound(comp);
                return;
            }

            //this block handles USER_NAME_ALREADY_EXIST and UNAUTHORIZED (invalid login details)
            if (error.response.status === 401 || error.response.status === 601) {
                console.log(error.response.status + ": " + error.response.data.error);
                this.showRedNoteToUser(error.response.data.error, comp);
                return;
            }

            //this block handles GENERAL_ERROR and NO_VACATION_DATA
            if (error.response.status === 600 || error.response.status === 500) {
                console.log(error.response.status + ": " + error.response.data.error);
                this.showSnackbarWithErrorStatus(error.response.status, error.response.data.error, comp);
                this.hideSnackbarAndSendToPageNotFound(comp);
                return;
            }

            //this block handles NO_FOLLOWERS
            if (error.response.status === 410) {
                console.log(error.response.status + ": " + error.response.data.error);
                this.showSnackbarWithErrorStatus(error.response.status, error.response.data.error, comp);
                this.hideSnackbar(comp);
                return;
            }

            //this block handles INVALID_TOKEN
            if (error.response.status === 403) {
                console.log(error.response.status + ": " + error.response.data.error);
                this.showSnackbarWithErrorStatus(error.response.status, error.response.data.error, comp);
                this.hideSnackbar(comp);
                this.sendBackToHomePage(comp);
                return;
            }
        }

        //handles 'server-off' issue
        if (error.message === "Network Error") {
            if (comp.state.socket !== undefined) {
                comp.state.socket.disconnect();
            }
        }

        console.log(error.message);
        this.showSnackbarWithErrorStatus("Unknown", error.message, comp);
        this.hideSnackbar(comp);
    }

    public static showSnackbarWithErrorStatus(errorStatus: any, errorMessage: any, comp: any) {
        let newErrorHandlerState = { ...comp.state };

        newErrorHandlerState.isShowSnackbar = true;
        newErrorHandlerState.snackbarMessage = errorStatus + ": " + errorMessage;
        comp.setState(newErrorHandlerState)
    }

    public static showSnackbar(errorMessage: any, comp: any) {
        let newErrorHandlerState = { ...comp.state };
        newErrorHandlerState.isShowSnackbar = true;
        newErrorHandlerState.snackbarMessage = errorMessage;
        comp.setState(newErrorHandlerState)
    }

    public static hideSnackbar(comp: any) {
        setTimeout(() => {
            let newErrorHandlerState = { ...comp.state }
            newErrorHandlerState.isShowSnackbar = false;
            comp.setState(newErrorHandlerState)
        }, 2200)
    }

    public static sendBackToHomePage(comp: any) {
        setTimeout(() => {
            sessionStorage.clear();
            store.dispatch({ type: ActionType.updateIsUserLoggedIn })
            comp.props.history.push("/home");
        }, 2200)
    }

    public static showRedNoteToUser(error: any, comp: any) {
        let newState = { ...comp.state }
        newState.isShowNote = true;
        newState.noteToUser = error;
        comp.setState(newState);
    }

    public static hideSnackbarAndSendToPageNotFound(comp: any) {
        setTimeout(() => {
            let newErrorHandlerState = { ...comp.state }
            newErrorHandlerState.isShowSnackbar = false;
            comp.setState(newErrorHandlerState);
            comp.props.history.push('/pageNotFound')
        }, 2200)
    }
}