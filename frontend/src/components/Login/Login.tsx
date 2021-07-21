import React, { Component, ChangeEvent } from 'react'
import './Login.css';
import { withRouter } from 'react-router-dom';

import { UserLoginDetails } from '../../models/UserLoginDetails';
import { SuccessfulLoginServerResponse } from '../../models/SuccessfulLoginServerResponse';
import axios from 'axios';

import { store } from '../../redux/store';
import { ActionType } from '../../redux/action-type';
import ErrorHandlerUiUtils from '../../utils/ErrorHandlerUIUtils';

import Snackbar from '@material-ui/core/Snackbar';
import { GoogleLogin } from 'react-google-login';

import LoginUtils from '../../utils/LoginUtils';

interface loginState {
    username: string,
    password: string,

    isShowSnackbar: boolean,
    snackbarMessage: string,

    isShowNote: boolean,
    noteToUser?: string
}

class Login extends Component<any, loginState> {
    private URL: string = this.props.URL;
    private btn: React.RefObject<HTMLButtonElement>;

    public constructor(props: any) {
        super(props);

        this.btn = React.createRef();

        this.state = {
            username: "",
            password: "",

            isShowSnackbar: false,
            snackbarMessage: "",

            isShowNote: false
        }
    }
    private setUsername = (event: ChangeEvent<HTMLInputElement>) => {
        const username = event.target.value;

        this.setState({ username });
    }

    private setPassword = (event: ChangeEvent<HTMLInputElement>) => {
        const password = event.target.value;

        this.setState({ password });
    }

    private isFormFieldsValid = () => {
        if (this.state.username.trim() === "" || this.state.password.trim() === "") {
            let newLoginState = { ...this.state }
            newLoginState.isShowNote = true
            newLoginState.noteToUser = "All fields must be filled!"
            this.setState(newLoginState)
            return false;
        }
        return true;
    }

    private onLoginClicked = async () => {
        if (!this.isFormFieldsValid()) {
            return;
        }

        //to prevent double clicks
        let currentBtn = this.btn.current;
        currentBtn.setAttribute("disabled", "disabled");

        try {
            console.log("Entered login");
            let userDetails = {
                username: this.state.username,
                password: this.state.password,
                token: ""
            }

            let userLoginDetails = new UserLoginDetails(userDetails.username, userDetails.password);

            const response = await axios.post<SuccessfulLoginServerResponse>(this.URL + "users/login", userLoginDetails);
            const serverResponse = response.data;
            userDetails.token = serverResponse.token;

            store.dispatch({ type: ActionType.updateIsUserLoggedIn });

            LoginUtils.setUsersCache(userDetails.token, userDetails.username);

            LoginUtils.setTokenToAxiosHeaders(userDetails.token);

            store.dispatch({ type: ActionType.registerToSocketsIO, payload: userDetails.token });

            LoginUtils.routeUserToMainPage(this, serverResponse);
        }
        catch (error) {
            ErrorHandlerUiUtils.handleErrorsOnUi(error, this);
        }
        finally {
            currentBtn.removeAttribute("disabled");
        }
    }

    public render() {
        return (
            <div className="login">
                <input type="text" placeholder="Username" value={this.state.username} onChange={this.setUsername} />
                <input type="password" placeholder="Password" value={this.state.password} onChange={this.setPassword} />
                <button ref={this.btn} onClick={this.onLoginClicked}>Sign in</button>

                <div style={{ flexBasis: "0" }}>
                    <GoogleLogin
                        clientId="219385968064-tml33i2rpnef1cdkmaakmddp1bvq1g7i.apps.googleusercontent.com"
                        buttonText="Login with Google"
                        onSuccess={(response) => LoginUtils.responseSuccessfulGoogleLogin(response, this)}
                        onFailure={(response) => LoginUtils.responseFailureGoogleLogin(response)}
                        cookiePolicy={'single_host_origin'}
                    />
                </div>

                <div className="noteContainer">
                    {this.state.isShowNote && <p className="noteToUser">{this.state.noteToUser}</p>}
                </div>

                <Snackbar
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    open={this.state.isShowSnackbar}
                    message={this.state.snackbarMessage}
                />
            </div>
        )
    }
}
export default withRouter(Login);