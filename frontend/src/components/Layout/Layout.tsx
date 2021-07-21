import React, { Component } from 'react'
import { Switch, Route, BrowserRouter, Redirect } from "react-router-dom";

import Admin from '../Admin/Admin';
import Footer from '../Footer/Footer';
import Header from '../Header/Header';
import Home from '../Home/Home';
import Nav from '../Nav/Nav';
import Client from '../Client/Client';
import PageNotFound from '../PageNotFound/PageNotFound';

import './Layout.css'

interface layoutProps {
    URL: string
}

export default class Layout extends Component<layoutProps> {
    private URL: string = this.props.URL;

    render() {
        return (
            <BrowserRouter>
                <section className="layout">
                    <nav>
                        <Nav URL={this.URL} />
                    </nav>
                    <header>
                        <Header />
                    </header>
                    <main>
                        <Switch>
                            <Redirect from="/" to="/home" exact />
                            <Route path="/home" render={(props) => (<Home URL={this.URL} {...props} />)} exact />
                            <Route path="/client" render={(props) => (<Client URL={this.URL} {...props} />)} exact />
                            <Route path="/admin" render={(props) => (<Admin URL={this.URL} {...props} />)} exact />
                            <Route component={PageNotFound} />
                        </Switch>
                    </main>

                    <footer>
                        <Footer />
                    </footer>
                </section>
            </BrowserRouter>
        )
    }
}