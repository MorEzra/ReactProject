import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'

import { store } from '../../redux/store'
import { ActionType } from '../../redux/action-type'
import { Unsubscribe } from 'redux'
import axios from 'axios'
import ErrorHandlerUiUtils from '../../utils/ErrorHandlerUIUtils'
import Snackbar from '@material-ui/core/Snackbar';

import './Nav.css'
import LoginUtils from '../../utils/LoginUtils'

interface navState {
    isLoggedIn: boolean,
    socket: any,
    isShowSnackbar: boolean,
    snackbarMessage: string
}

class Nav extends Component<any, navState> {
    private URL: string = this.props.URL;
    private btn: React.RefObject<HTMLButtonElement>;
    private unsubscribeStore: Unsubscribe;

    constructor(props: any) {
        super(props);

        this.btn = React.createRef();

        this.state = {
            isLoggedIn: store.getState().isUserLoggedIn,
            socket: store.getState().socket,
            isShowSnackbar: false,
            snackbarMessage: ""
        }
    }

    public componentDidMount = () => {
        //in order to 'survive' page refresh
        let token = sessionStorage.getItem("token");
        LoginUtils.setTokenToAxiosHeaders(token);

        this.unsubscribeStore = store.subscribe(() =>
            this.setState({
                isLoggedIn: store.getState().isUserLoggedIn,
                socket: store.getState().socket
            }));

        if (token != null) {
            store.dispatch({ type: ActionType.updateIsUserLoggedIn });
        }
    }

    public componentWillUnmount = () => {
        this.unsubscribeStore();
    }

    private onLogOutClicked = async () => {
        //to prevent double clicks
        let currentBtn = this.btn.current;
        currentBtn.setAttribute("disabled", "disabled");

        try {
            this.state.socket.disconnect();

            //clear user from server cache
            let token = sessionStorage.getItem("token");
            LoginUtils.setTokenToAxiosHeaders(token);

            await axios.post(this.URL + "users/logout");

            let message = "Logging out...";
            ErrorHandlerUiUtils.showSnackbar(message, this);
            ErrorHandlerUiUtils.hideSnackbar(this);
            ErrorHandlerUiUtils.sendBackToHomePage(this);
        }
        catch (error) {
            ErrorHandlerUiUtils.handleErrorsOnUi(error, this);
        }
    }

    public render() {
        return (
            <div className="nav">
                <nav className="navbar navbar-expand-lg">
                    <span onClick={() => this.props.history.push('/home')}><i className="fas fa-igloo fa-2x igloo" /></span>
                    <ul className="navbar-nav">
                        <li>
                            {store.getState().isUserLoggedIn &&
                                <div>
                                    <span style={{ color: "white", fontWeight: 700 }}>Hello {sessionStorage.getItem("username")} </span>
                                    <button ref={this.btn} id="logOutButton" onClick={this.onLogOutClicked}>Log out</button>
                                </div>}
                        </li>
                    </ul>
                </nav>
                <Snackbar
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    open={this.state.isShowSnackbar}
                    message={this.state.snackbarMessage}
                />
            </div>
        )
    }
}

export default withRouter(Nav);