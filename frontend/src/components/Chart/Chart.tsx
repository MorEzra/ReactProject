import React, { Component } from 'react'
import axios from 'axios'
import { Bar } from 'react-chartjs-2'

import { Vacation } from '../../models/Vacation';

import { withRouter } from 'react-router-dom';
import ErrorHandlerUiUtils from '../../utils/ErrorHandlerUIUtils';

import Snackbar from '@material-ui/core/Snackbar';
import { store } from '../../redux/store';
import { ActionType } from '../../redux/action-type';
import { Unsubscribe } from 'redux';
import LoginUtils from '../../utils/LoginUtils';

interface chartState {
    chartInfo: any,
    socket: any,
    isShowSnackbar: boolean,
    snackbarMessage: string
}

class Chart extends Component<any, chartState> {
    private URL: string = this.props.URL;
    private unsubscribeStore: Unsubscribe;

    constructor(props: any) {
        super(props);

        this.state = {
            chartInfo: {},
            socket: store.getState().socket,
            isShowSnackbar: false,
            snackbarMessage: ""
        }

        this.unsubscribeStore = store.subscribe(() =>
            this.setState({ socket: store.getState().socket }));
    }

    public componentDidMount = async () => {
        let token = sessionStorage.getItem("token");
        LoginUtils.setTokenToAxiosHeaders(token);

        try {
            //listen to sockets port if you are not already listening
            if (this.state.socket === undefined || this.state.socket.connected === false) {
                store.dispatch({ type: ActionType.registerToSocketsIO, payload: token });
            }

            this.registerSocketListeners();
            this.createChart();
        }
        catch (error) {
            ErrorHandlerUiUtils.handleErrorsOnUi(error, this);
        }
    }

    public componentWillUnmount = () => {
        this.unsubscribeStore();
    }

    private createChart = async () => {
        try {
            let token = sessionStorage.getItem("token");
            LoginUtils.setTokenToAxiosHeaders(token);

            const response = await axios.get(this.URL + "vacations/followed");

            let labels = [];
            let data = [];

            for (let index = 0; index < response.data.length; index++) {
                labels.push(response.data[index].destination);
                data.push(response.data[index].numOfFollowers);
            }

            let newChartState = { ...this.state }
            newChartState.chartInfo = {
                labels: labels,
                data: data
            }
            this.setState(newChartState);
        }
        catch (error) {
            ErrorHandlerUiUtils.handleErrorsOnUi(error, this);
        }
    }

    private registerSocketListeners = () => {
        this.state.socket.on('follow-vacation', (vacation: Vacation) => {
            let newChartState = { ...this.state }

            if (newChartState.chartInfo.labels.includes(vacation.destination)) {
                let indexForUpdate = newChartState.chartInfo.labels.indexOf(vacation.destination);
                newChartState.chartInfo.data[indexForUpdate] = newChartState.chartInfo.data[indexForUpdate] + 1;
            } else {
                newChartState.chartInfo.labels.push(vacation.destination);
                newChartState.chartInfo.data.push(1);
            }

            this.setState(newChartState);
        });

        this.state.socket.on('unfollow-vacation', (vacation: Vacation) => {
            let newChartState = { ...this.state }
            let indexForUpdate = newChartState.chartInfo.labels.indexOf(vacation.destination);

            if (newChartState.chartInfo.data[indexForUpdate] === 1) {
                newChartState.chartInfo.data.splice(indexForUpdate, 1);
                newChartState.chartInfo.labels.splice(indexForUpdate, 1);
            } else if (newChartState.chartInfo.data[indexForUpdate] > 1) {
                newChartState.chartInfo.data[indexForUpdate] = newChartState.chartInfo.data[indexForUpdate] - 1;
            }

            this.setState(newChartState);
        });
    }

    render() {
        return (
            <div className="inner">
                <h2>My charts - followed vacations</h2>
                <Bar redraw
                    data={{
                        labels: this.state.chartInfo.labels,
                        datasets: [
                            {
                                backgroundColor: '#dddddd',
                                borderColor: 'none',
                                borderWidth: 0,
                                data: this.state.chartInfo.data
                            }
                        ]
                    }}
                    options={{
                        title: {
                            display: false
                        },
                        legend: {
                            display: false
                        },
                        scales: {
                            yAxes: [{
                                ticks: {
                                    beginAtZero: true,
                                    min: 0,
                                    stepSize: 1
                                }
                            }]
                        }, responsive: true
                    }}
                    width={240}
                    height={120}
                />

                <Snackbar
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    open={this.state.isShowSnackbar}
                    message={this.state.snackbarMessage}
                />
            </div>
        )
    }
}

export default withRouter(Chart);