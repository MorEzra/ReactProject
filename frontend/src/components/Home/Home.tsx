import React, { Component } from 'react'
import axios from 'axios';

import Login from '../Login/Login'
import Register from '../Register/Register'
import './Home.css'
import ErrorHandlerUiUtils from '../../utils/ErrorHandlerUIUtils';

import Snackbar from '@material-ui/core/Snackbar';
import LoginUtils from '../../utils/LoginUtils';

interface homeState {
    isShowSnackbar: boolean,
    snackbarMessage: string
}

export default class Home extends Component<any, homeState> {
    private URL: string = this.props.URL;
    constructor(props: any) {
        super(props)

        this.state = {
            isShowSnackbar: false,
            snackbarMessage: ""
        }
    }

    public componentDidMount = async () => {
        //in order to 'survive' page refresh
        let token = sessionStorage.getItem("token");
        LoginUtils.setTokenToAxiosHeaders(token);

        try {
            //if user is already logged in, we send him back to the proper page
            if (token != null) {
                const response = await axios.get(this.URL + "users/details");

                LoginUtils.routeUserToMainPage(this, response);
            }
        }
        catch (error) {
            ErrorHandlerUiUtils.handleErrorsOnUi(error, this);
        }
    }

    render() {
        return (
            <div className="home">
                <div className="login">
                    <h3>Already registered?</h3><h2>Login</h2>
                    <Login URL={this.URL} />
                </div>
                <div className="vl"></div>
                <hr />
                <div className="register">
                    <h3>New user?</h3><h2>Register</h2>
                    <Register URL={this.URL} />
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