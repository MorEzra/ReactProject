import React, { Component, ChangeEvent } from 'react'

import axios from 'axios'
import { withRouter } from 'react-router-dom'
import { UserRegisterDetails } from '../../models/UserRegisterDetails'
import { SuccessfulLoginServerResponse } from '../../models/SuccessfulLoginServerResponse'
import { ActionType } from '../../redux/action-type'
import { store } from '../../redux/store'
import ErrorHandlerUiUtils from '../../utils/ErrorHandlerUIUtils'
import Snackbar from '@material-ui/core/Snackbar';

import './Register.css';
import { GoogleLogin } from 'react-google-login';

import LoginUtils from '../../utils/LoginUtils';

interface registerState {
    firstName: string,
    surname: string,
    username: string,
    password: string,

    isShowSnackbar: boolean,
    snackbarMessage: string,

    isShowNote: boolean,
    noteToUser?: string
}

class Register extends Component<any, registerState> {
    private URL: string = this.props.URL;
    private btn: React.RefObject<HTMLButtonElement>;

    public constructor(props: any) {
        super(props);

        this.btn = React.createRef();

        this.state = {
            firstName: "",
            surname: "",
            username: "",
            password: "",

            isShowSnackbar: false,
            snackbarMessage: "",

            isShowNote: false
        }
    }

    private setFirstName = (event: ChangeEvent<HTMLInputElement>) => {
        const firstName = event.target.value;

        this.setState({ firstName });
    }

    private setSurname = (event: ChangeEvent<HTMLInputElement>) => {
        const surname = event.target.value;

        this.setState({ surname });
    }

    private setPassword = (event: ChangeEvent<HTMLInputElement>) => {
        const password = event.target.value;

        this.setState({ password });
    }

    private setUsername = (event: ChangeEvent<HTMLInputElement>) => {
        const username = event.target.value;

        this.setState({ username });
    }

    private isFormFieldsValid = () => {
        if (this.state.firstName.trim() === "" || this.state.surname.trim() === "" || this.state.username.trim() === "" || this.state.password.trim() === "") {
            let newRegisterState = { ...this.state }
            newRegisterState.isShowNote = true
            newRegisterState.noteToUser = "All fields must be filled!"
            this.setState(newRegisterState)
            return false;
        }

        if (this.state.firstName.length > 20 || this.state.surname.length > 20 || this.state.username.length > 20 || this.state.password.length > 20) {
            let newRegisterState = { ...this.state }
            newRegisterState.isShowNote = true
            newRegisterState.noteToUser = "Fields can include max 20 characters"
            this.setState(newRegisterState)
            return false;
        }

        if (this.state.password.length < 6) {
            let newRegisterState = { ...this.state }
            newRegisterState.isShowNote = true
            newRegisterState.noteToUser = "Password must include at least 6 characters"
            this.setState(newRegisterState)
            return false;
        }

        this.setState({ isShowNote: false })
        return true;
    }

    private onRegisterClicked = async () => {
        if (!this.isFormFieldsValid()) {
            return;
        }

        //to prevent double clicks
        let currentBtn = this.btn.current;
        currentBtn.setAttribute("disabled", "disabled");

        try {
            console.log("Entered register");
            let userDetails = {
                firstName: this.state.firstName,
                surname: this.state.surname,
                username: this.state.username,
                password: this.state.password,
                token: ""
            }

            let userRegisterDetails = new UserRegisterDetails(userDetails.firstName, userDetails.surname, userDetails.username, userDetails.password);

            const response = await axios.post<SuccessfulLoginServerResponse>(this.URL + 'users/register', userRegisterDetails)
            const serverResponse = response.data;
            userDetails.token = serverResponse.token;

            //update appState for nav component
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
            <div className="register">
                <input type="text" placeholder="First Name" value={this.state.firstName} onChange={this.setFirstName} />
                <input type="text" placeholder="Surname" value={this.state.surname} onChange={this.setSurname} />
                <input type="text" placeholder="Username" value={this.state.username} onChange={this.setUsername} />
                <input type="password" placeholder="Password" value={this.state.password} onChange={this.setPassword} />
                <button ref={this.btn} placeholder="Sign up" onClick={this.onRegisterClicked}>Register</button>

                <div style={{ flexBasis: "0" }}>
                    <GoogleLogin
                        clientId="219385968064-tml33i2rpnef1cdkmaakmddp1bvq1g7i.apps.googleusercontent.com"
                        buttonText="Sign-up with Google"
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
export default withRouter(Register);