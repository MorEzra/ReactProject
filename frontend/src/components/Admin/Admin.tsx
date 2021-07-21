import React, { ChangeEvent, Component } from 'react'
import axios from 'axios'

import './Admin.css'
import { Vacation } from '../../models/Vacation';

import Chart from '../Chart/Chart';

import { withRouter } from 'react-router-dom';
import ErrorHandlerUiUtils from '../../utils/ErrorHandlerUIUtils';
import moment from 'moment';

import Snackbar from '@material-ui/core/Snackbar';
import VacationsUtils from '../../utils/VacationsUtils';
import { store } from '../../redux/store';
import { ActionType } from '../../redux/action-type';
import { Unsubscribe } from 'redux';
import LoginUtils from '../../utils/LoginUtils';

interface adminState {
    vacations: Vacation[],
    socket: any,
    isShowModal: boolean,
    isShowUpdateButton: boolean,
    isShowChartModal: boolean,
    minDate: any,
    isShowSnackbar: boolean,
    fileInputLabel: string,
    picForPreview: any,
    snackbarMessage?: string
}

class Admin extends Component<any, adminState> {
    private URL: string = this.props.URL;
    private unsubscribeStore: Unsubscribe;

    private btn: React.RefObject<HTMLButtonElement>;
    private vacation = new Vacation("", "", "", this.URL + "no-image.jpg", "", "", 0);
    private fileToDelete: string;

    constructor(props: any) {
        super(props);

        //in order to disable\enable buttons (prevent double clicks)
        this.btn = React.createRef();

        this.state = {
            vacations: [],
            socket: store.getState().socket,
            isShowModal: false,
            isShowUpdateButton: false,
            isShowChartModal: false,
            minDate: moment(new Date()).format('YYYY-MM-DD'),
            isShowSnackbar: false,
            fileInputLabel: "Choose file",
            picForPreview: this.URL + "no-image.jpg"
        }

        this.unsubscribeStore = store.subscribe(() =>
            this.setState({ socket: store.getState().socket }));
    }

    public async componentDidMount() {
        //in order to 'survive' page refresh
        let token = sessionStorage.getItem("token");
        LoginUtils.setTokenToAxiosHeaders(token);

        try {
            //if user is already logged in, we send him back to the proper page
            if (token != null) {
                const response = await axios.get(this.URL + "users/details");

                if (response.data.userType !== "Admin") {
                    this.props.history.push('/home');
                    return;
                }

                //listen to sockets port if you are not already listening
                if (this.state.socket === undefined || this.state.socket.connected === false) {
                    store.dispatch({ type: ActionType.registerToSocketsIO, payload: token });
                }

            } else {
                this.props.history.push('/home');
                return;
            }

            this.registerSocketListeners();

            const response = await axios.get<Vacation[]>(this.URL + "vacations");

            let newAdminState = { ...this.state };
            newAdminState.vacations = (response.data);
            this.setState(newAdminState);
        }
        catch (error) {
            ErrorHandlerUiUtils.handleErrorsOnUi(error, this);
        }
    }

    public componentWillUnmount = () => {
        this.unsubscribeStore();
    }

    private registerSocketListeners = () => {
        this.state.socket.on('follow-vacation', (vacation: Vacation) => {
            let newAdminState = { ...this.state }

            let index = VacationsUtils.getVacationIndex(newAdminState, vacation);

            newAdminState.vacations[index].numOfFollowers = newAdminState.vacations[index].numOfFollowers + 1;

            this.setState(newAdminState)
        })

        this.state.socket.on('unfollow-vacation', (vacation: Vacation) => {
            let newAdminState = { ...this.state }

            let index = VacationsUtils.getVacationIndex(newAdminState, vacation);

            newAdminState.vacations[index].numOfFollowers = newAdminState.vacations[index].numOfFollowers - 1;

            this.setState(newAdminState)
        })
    }

    private setDestination = (event: ChangeEvent<HTMLInputElement>) => {
        const destination = event.target.value;

        this.vacation.destination = destination;
    }

    private setDescription = (event: ChangeEvent<HTMLTextAreaElement>) => {
        const description = event.target.value;

        this.vacation.description = description;
    }

    private setPicture = (event: ChangeEvent<HTMLInputElement>) => {
        const picture = event.target.files[0];

        //for preview
        let reader = new FileReader();
        reader.onload = (e) => {
            let newAdminState = { ...this.state };
            newAdminState.picForPreview = e.target.result;
            newAdminState.fileInputLabel = picture.name;
            this.setState(newAdminState);
        }

        reader.readAsDataURL(picture);

        this.vacation.picture = picture;
    }

    private setStartDate = (event: ChangeEvent<HTMLInputElement>) => {
        const startDate = event.target.value;

        let minDate = moment(startDate).format('YYYY-MM-DD');
        this.setState({ minDate });

        this.vacation.startDate = startDate;
    }

    private setEndDate = (event: ChangeEvent<HTMLInputElement>) => {
        const endDate = event.target.value;

        this.vacation.endDate = endDate;
    }

    private setPrice = (event: ChangeEvent<HTMLInputElement>) => {
        const price = +event.target.value;

        this.vacation.price = price;
    }

    private onHandleModalButtonsDisplay = (isShowUpdateButton: boolean, vacation?: Vacation) => {
        let newAdminState = { ...this.state };
        newAdminState.isShowModal = !(newAdminState.isShowModal);
        //on update vacation
        if (isShowUpdateButton === true) {
            newAdminState.isShowUpdateButton = true;
            newAdminState.minDate = moment(new Date()).format('YYYY-MM-DD');
            newAdminState.fileInputLabel = vacation.picture.slice(this.URL.length, vacation.picture.length);
            newAdminState.picForPreview = vacation.picture;
            this.fileToDelete = vacation.picture;

        } else { //on add vacation
            newAdminState.isShowUpdateButton = false;
            newAdminState.minDate = moment(new Date()).format('YYYY-MM-DD');
            newAdminState.picForPreview = this.URL + "no-image.jpg";
            newAdminState.fileInputLabel = "Choose file";
        }

        this.setState(newAdminState);

        //init for form inputs
        this.vacation = new Vacation("", "", "", this.URL + "no-image.jpg", "", "", 0);
    }

    private isFormFieldsValid = () => {
        if (this.vacation.destination.trim() === "" || this.vacation.description.trim() === "" || this.vacation.picture === "" || this.vacation.startDate === "" || this.vacation.endDate === "" || this.vacation.price === +"" || this.vacation.picture === this.URL + "no-image.jpg") {
            let errorMessage = "All fields must be filled correctly!";
            ErrorHandlerUiUtils.showSnackbar(errorMessage, this);
            ErrorHandlerUiUtils.hideSnackbar(this);
            return false;
        }
        if (Date.parse(this.vacation.endDate) <= Date.parse(this.vacation.startDate)) {
            let errorMessage = "End date must be later than start date!";
            ErrorHandlerUiUtils.showSnackbar(errorMessage, this);
            ErrorHandlerUiUtils.hideSnackbar(this);
            return false;
        }

        if (this.vacation.destination.length < 2 ||
            this.vacation.description.length < 10) {
            let errorMessage = "some of the text fields you entered are too short!";
            ErrorHandlerUiUtils.showSnackbar(errorMessage, this);
            ErrorHandlerUiUtils.hideSnackbar(this);
            return false;
        }

        if (this.vacation.destination.length > 45 ||
            this.vacation.description.length > 1000) {
            let errorMessage = "some of the text fields you entered are too long!";
            ErrorHandlerUiUtils.showSnackbar(errorMessage, this);
            ErrorHandlerUiUtils.hideSnackbar(this);
            return false;
        }

        return true;
    }

    private onCreateVacationClicked = async () => {
        if (!this.isFormFieldsValid()) {
            return;
        }

        //to prevent double clicks
        let currentBtn = this.btn.current;
        currentBtn.setAttribute("disabled", "disabled");

        const data = new FormData()
        data.append('file', this.vacation.picture)

        //in order to 'survive' fake token
        let token = sessionStorage.getItem("token");
        LoginUtils.setTokenToAxiosHeaders(token);

        try {
            const res = await axios.post(this.URL + "vacations/upload", data, {})

            this.vacation.picture = res.data.filename;

            let newVacationDetails = this.vacation;

            const response = await axios.post(this.URL + 'vacations/add', newVacationDetails);

            this.fixDateFormat(response.data);

            this.state.socket.emit('add-vacation', response.data);

            let newAdminState = { ...this.state }
            newAdminState.isShowModal = !(newAdminState.isShowModal);
            newAdminState.vacations.push(response.data);
            newAdminState.fileInputLabel = "Choose file";
            this.setState(newAdminState);

            //init instance for next usage
            this.vacation = new Vacation("", "", "", this.URL + "no-image.jpg", "", "", 0);
        }
        catch (error) {
            ErrorHandlerUiUtils.handleErrorsOnUi(error, this);
        }
        finally {
            currentBtn.removeAttribute("disabled");
        }
    }

    private onDeleteVacationClicked = async (vacation: Vacation) => {
        try {
            //in order to 'survive' fake token
            let token = sessionStorage.getItem("token");
            LoginUtils.setTokenToAxiosHeaders(token);

            await axios.delete(this.URL + 'vacations/delete/' + vacation.id);

            this.state.socket.emit('delete-vacation', vacation);

            let newAdminState = { ...this.state };
            let indexForDelete = VacationsUtils.getVacationIndex(newAdminState, vacation);
            newAdminState.vacations.splice(indexForDelete, 1);
            this.setState(newAdminState);
        }
        catch (error) {
            ErrorHandlerUiUtils.handleErrorsOnUi(error, this);
        }
    }

    private onShowUpdateModalClicked = (vacation: Vacation) => {
        this.onHandleModalButtonsDisplay(true, vacation);

        //fix the format in order to put back in input fields
        let newStartDate = vacation.startDate.split("/").reverse().join("-");
        let newEndDate = vacation.endDate.split("/").reverse().join("-");

        //fill fields with the required info    
        this.vacation = new Vacation(
            vacation.id,
            vacation.destination,
            vacation.description,
            vacation.picture,
            newStartDate,
            newEndDate,
            vacation.price,
            vacation.numOfFollowers
        )
    }

    private onUpdateVacationClicked = async () => {
        if (!this.isFormFieldsValid()) {
            return;
        }

        //to prevent double clicks
        let currentBtn = this.btn.current;
        currentBtn.setAttribute("disabled", "disabled");

        const data = new FormData();
        data.append('fileToDelete', this.fileToDelete);
        data.append('file', this.vacation.picture);

        //in order to 'survive' fake token
        let token = sessionStorage.getItem("token");
        LoginUtils.setTokenToAxiosHeaders(token);

        try {
            if (this.vacation.picture !== this.fileToDelete) {
                const res = await axios.post(this.URL + "vacations/upload", data, {});
                this.vacation.picture = res.data.filename;
            }

            await axios.put(this.URL + 'vacations/update', this.vacation);

            this.fixDateFormat(this.vacation);

            this.state.socket.emit('update-vacation', this.vacation);

            let newAdminState = { ...this.state }
            newAdminState.isShowModal = !(newAdminState.isShowModal);
            let indexForUpdate = VacationsUtils.getVacationIndex(newAdminState, this.vacation);
            newAdminState.vacations[indexForUpdate] = this.vacation;
            this.setState(newAdminState);

            this.vacation = new Vacation("", "", "", this.URL + "no-image.jpg", "", "", 0);
        }
        catch (error) {
            ErrorHandlerUiUtils.handleErrorsOnUi(error, this)
        }
        finally {
            currentBtn.removeAttribute("disabled");
        }
    }

    private fixDateFormat = (vacationData: any) => {
        //fix format for UI use
        vacationData.startDate = moment(vacationData.startDate, 'YYYY-MM-DD').format('DD/MM/YYYY');
        vacationData.endDate = moment(vacationData.endDate, 'YYYY-MM-DD').format('DD/MM/YYYY');
    }

    private onShowChartClicked = () => {
        let newAdminState = { ...this.state }
        newAdminState.isShowChartModal = !(newAdminState.isShowChartModal);
        this.setState(newAdminState);
    }

    render() {
        return (
            <div className="admin">
                {this.state.isShowModal &&
                    <div className="popUp">
                        <div className="modalContainer">
                            <i className="fas fa-times fa-2x closePopUp" onClick={() => this.onHandleModalButtonsDisplay(false)} />
                            {!this.state.isShowUpdateButton && <h2>Add Vacation</h2>}
                            {this.state.isShowUpdateButton && <h2>Update Vacation</h2>}
                            <div className="inner">
                                <div className="half">
                                    <div className="custom-file">
                                        <input type="file" accept="image/*" className="custom-file-input" id="inputGroupFile01" aria-describedby="inputGroupFileAddon01" onChange={this.setPicture} />
                                        <label htmlFor="inputGroupFile01"><i className="fas fa-upload fa-1x" />{this.state.fileInputLabel}</label>
                                    </div>
                                    <div className="previewImg">
                                        <img src={this.state.picForPreview} alt={this.vacation.destination} />
                                    </div>
                                </div>

                                <div className="half">
                                    <input type="text" className="form-control" placeholder="Destination" defaultValue={this.vacation.destination} onChange={this.setDestination} />
                                    <textarea rows={5} className="form-control" placeholder="Description..." defaultValue={this.vacation.description} onChange={this.setDescription}></textarea>

                                    <div className="input-group">
                                        <label>From:</label>
                                        <input type="date" className="form-control date" min={this.state.minDate} max={"2100-01-01"} onKeyDown={(e) => e.preventDefault()} defaultValue={this.vacation.startDate} onChange={this.setStartDate}></input>
                                    </div>
                                    <div className="input-group">
                                        <label style={{ marginRight: "22px" }}>To:</label>
                                        <input type="date" className="form-control date" min={this.state.minDate} max={"2100-01-01"} onKeyDown={(e) => e.preventDefault()} defaultValue={this.vacation.endDate} onChange={this.setEndDate}></input>
                                    </div>

                                    <div className="input-group">
                                        <label htmlFor="price">Price:</label>
                                        <input type="number" min="0" className="form-control" id="price" placeholder="Price" defaultValue={this.vacation.price} onChange={this.setPrice} />
                                    </div>
                                </div>

                                {!this.state.isShowUpdateButton && <div className="btn"><button ref={this.btn} onClick={this.onCreateVacationClicked}>Create</button></div>}
                                {this.state.isShowUpdateButton && <div className="btn">
                                    <button ref={this.btn} onClick={this.onUpdateVacationClicked}>Update</button>
                                </div>}
                            </div>
                        </div>
                    </div>
                }

                {this.state.isShowChartModal &&
                    <div className="popUp">
                        <div className="modalContainer">
                            <i className="fas fa-times fa-2x closePopUp" onClick={this.onShowChartClicked}></i>
                            <Chart URL={this.URL} />
                        </div>
                    </div>
                }

                <div className="administration">
                    <i className="far fa-plus-square fa-2x addVacation" onClick={() => this.onHandleModalButtonsDisplay(false)}><span>Add vacation</span></i>
                    <i className="far fa-chart-bar fa-2x addVacation" onClick={this.onShowChartClicked}><span>My charts</span></i>
                </div>

                <div className="vacationsArea">
                    {this.state.vacations.map((vacation, index) =>
                        <div className="vacationBox" key={index}>
                            <div className="imageBox">
                                <img src={vacation.picture} alt={vacation.destination} />
                                <h2>{vacation.destination}</h2>
                            </div>
                            <i className="far fa-trash-alt fa-2x" id={vacation.id} onClick={() => this.onDeleteVacationClicked(vacation)}></i>
                            <i className="far fa-edit fa-2x" onClick={() => this.onShowUpdateModalClicked(vacation)}></i>
                            <div className="vacationInfo">
                                <p className="info">{vacation.description}</p>
                                <p>{vacation.startDate} - {vacation.endDate}</p>
                            </div>
                            <div className="boxFooter">
                                <h3>{vacation.price}$</h3>
                                <i className="far fa-heart fa-lg heartIcon" /><span className="numOfFollowers">{vacation.numOfFollowers}</span>
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

export default withRouter(Admin);