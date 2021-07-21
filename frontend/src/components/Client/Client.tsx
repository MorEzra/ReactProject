import React, { Component } from 'react'
import axios from 'axios'

import './Client.css'
import { Vacation } from '../../models/Vacation';

import ErrorHandlerUiUtils from '../../utils/ErrorHandlerUIUtils';

import Snackbar from '@material-ui/core/Snackbar';
import VacationsUtils from '../../utils/VacationsUtils';
import { store } from '../../redux/store';
import { ActionType } from '../../redux/action-type';
import { Unsubscribe } from 'redux';
import LoginUtils from '../../utils/LoginUtils';

interface clientState {
    vacations: Vacation[],
    socket: any,
    isShowSnackbar: boolean,
    snackbarMessage: string
}

export default class Client extends Component<any, clientState> {
    private URL: string = this.props.URL;
    private unsubscribeStore: Unsubscribe;

    constructor(props: any) {
        super(props);

        this.state = {
            vacations: [],
            socket: store.getState().socket,
            isShowSnackbar: false,
            snackbarMessage: ""
        }

        this.unsubscribeStore = store.subscribe(() =>
            this.setState({ socket: store.getState().socket }));
    }


    public componentDidMount = async () => {
        //in order to 'survive' page refresh
        let token = sessionStorage.getItem("token");
        LoginUtils.setTokenToAxiosHeaders(token);

        try {
            //if user is already logged in, we send him back to the proper page
            if (token != null) {
                const response = await axios.get(this.URL + "users/details");

                //listen to sockets port if you are not listening (after refresh, for example)
                if (this.state.socket === undefined || this.state.socket.connected === false) {
                    store.dispatch({ type: ActionType.registerToSocketsIO, payload: token });
                }

                if (response.data.userType !== "Client") {
                    this.props.history.push('/home')
                    return;
                }
            } else {
                this.props.history.push('/home')
                return;
            }

            this.registerSocketListeners();

            const response = await axios.get<Vacation[]>(this.URL + "vacations");

            let newClientState = { ...this.state };
            newClientState.vacations = (response.data);
            this.setState(newClientState);

        }
        catch (error) {
            ErrorHandlerUiUtils.handleErrorsOnUi(error, this);
        }
    }

    public componentWillUnmount = () => {
        this.unsubscribeStore();
    }

    private registerSocketListeners = () => {
        this.state.socket.on('add-vacation', (newVacation: Vacation) => {
            let newClientState = { ...this.state }
            newClientState.vacations.push(newVacation);
            this.setState(newClientState);
        })

        this.state.socket.on('delete-vacation', (vacation: Vacation) => {
            let newClientState = { ...this.state };
            let indexForDelete = VacationsUtils.getVacationIndex(newClientState, vacation);
            newClientState.vacations.splice(indexForDelete, 1);
            this.setState(newClientState);
        })

        this.state.socket.on('update-vacation', (vacation: Vacation) => {
            let newClientState = { ...this.state }
            let indexForUpdate = VacationsUtils.getVacationIndex(newClientState, vacation);
            vacation.isFavorite = newClientState.vacations[indexForUpdate].isFavorite;
            newClientState.vacations[indexForUpdate] = vacation;
            this.setState(newClientState);
        })

        this.state.socket.on('follow-vacation', (vacation: Vacation) => {
            let newClientState = { ...this.state }
            let index = VacationsUtils.getVacationIndex(newClientState, vacation);
            newClientState.vacations[index].numOfFollowers = newClientState.vacations[index].numOfFollowers + 1;
            this.setState(newClientState);
        })

        this.state.socket.on('unfollow-vacation', (vacation: Vacation) => {
            let newClientState = { ...this.state }
            let index = VacationsUtils.getVacationIndex(newClientState, vacation);
            newClientState.vacations[index].numOfFollowers = newClientState.vacations[index].numOfFollowers - 1;
            this.setState(newClientState);
        })
    }

    private onCheckboxClicked = async (vacation: Vacation) => {
        //in order to 'survive' fake token
        let token = sessionStorage.getItem("token");
        LoginUtils.setTokenToAxiosHeaders(token);

        try {
            if (!vacation.isFavorite) {
                await axios.post(this.URL + 'vacations/follow/' + vacation.id);
                vacation.numOfFollowers = vacation.numOfFollowers + 1;
                this.state.socket.emit('follow-vacation', vacation);
            } else {
                await axios.delete(this.URL + 'vacations/unfollow/' + vacation.id);
                vacation.numOfFollowers = vacation.numOfFollowers - 1;
                this.state.socket.emit('unfollow-vacation', vacation);
            }
            vacation.isFavorite = !vacation.isFavorite;
            this.setState({ vacations: this.state.vacations });
        }
        catch (error) {
            ErrorHandlerUiUtils.handleErrorsOnUi(error, this);
        }
    }

    //sort by favorites
    private order = (a: Vacation, b: Vacation) => {
        if (a.isFavorite > b.isFavorite) {
            return -1;
        } else if (a.isFavorite < b.isFavorite) {
            return 1;
        } else {
            return 0;
        }
    }

    render() {
        return (
            <div className="client">
                <div className="vacationsArea">
                    {this.state.vacations.sort((a, b) => this.order(a, b)).map((vacation, index) =>
                        <div className="vacationBox" key={index}>
                            <div className="imageBox">
                                <img src={vacation.picture} alt={vacation.destination} />
                                <h2>{vacation.destination}</h2>
                            </div>
                            <div className="vacationInfo">
                                <p className="info">{vacation.description}</p>
                                <p>{vacation.startDate} - {vacation.endDate}</p>
                            </div>
                            <div className="boxFooter">
                                <h3>{vacation.price}$</h3>
                                <input type="checkbox" className="checkbox" id={vacation.id} checked={vacation.isFavorite} onChange={() => this.onCheckboxClicked(vacation)} />
                                <label htmlFor={vacation.id}>
                                    <svg id="heart-svg" viewBox="467 392 58 57" xmlns="http://www.w3.org/2000/svg"><g id="Group" fill="none" fillRule="evenodd" transform="translate(467 392)"><path d="M29.144 20.773c-.063-.13-4.227-8.67-11.44-2.59C7.63 28.795 28.94 43.256 29.143 43.394c.204-.138 21.513-14.6 11.44-25.213-7.214-6.08-11.377 2.46-11.44 2.59z" id="heart" fill="#AAB8C2" /><circle id="main-circ" fill="#E2264D" opacity="0" cx="29.5" cy="29.5" r="1.5" /><g id="grp7" opacity="0" transform="translate(7 6)"><circle id="oval1" fill="#9CD8C3" cx="2" cy="6" r="2" /><circle id="oval2" fill="#8CE8C3" cx="5" cy="2" r="2" /></g><g id="grp6" opacity="0" transform="translate(0 28)"><circle id="oval1" fill="#CC8EF5" cx="2" cy="7" r="2" /><circle id="oval2" fill="#91D2FA" cx="3" cy="2" r="2" /></g><g id="grp3" opacity="0" transform="translate(52 28)"><circle id="oval2" fill="#9CD8C3" cx="2" cy="7" r="2" /><circle id="oval1" fill="#8CE8C3" cx="4" cy="2" r="2" /></g><g id="grp2" opacity="0" transform="translate(44 6)" fill="#CC8EF5"><circle id="oval2" transform="matrix(-1 0 0 1 10 0)" cx="5" cy="6" r="2" /><circle id="oval1" transform="matrix(-1 0 0 1 4 0)" cx="2" cy="2" r="2" /></g><g id="grp5" opacity="0" transform="translate(14 50)" fill="#91D2FA"><circle id="oval1" transform="matrix(-1 0 0 1 12 0)" cx="6" cy="5" r="2" /><circle id="oval2" transform="matrix(-1 0 0 1 4 0)" cx="2" cy="2" r="2" /></g><g id="grp4" opacity="0" transform="translate(35 50)" fill="#F48EA7"><circle id="oval1" transform="matrix(-1 0 0 1 12 0)" cx="6" cy="5" r="2" /><circle id="oval2" transform="matrix(-1 0 0 1 4 0)" cx="2" cy="2" r="2" /></g><g id="grp1" opacity="0" transform="translate(24)" fill="#9FC7FA"><circle id="oval1" cx="2.5" cy="3" r="2" /><circle id="oval2" cx="7.5" cy="2" r="2" /></g></g></svg>
                                </label>
                                <p>{vacation.numOfFollowers}</p>
                            </div>
                        </div>
                    )}
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