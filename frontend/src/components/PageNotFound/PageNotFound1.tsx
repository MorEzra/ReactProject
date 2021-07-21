import React, { Component } from 'react'
import { NavLink } from 'react-router-dom';
import './PageNotFound1.css';

export default class PageNotFound1 extends Component {
    render() {
        return (
            <div className="ghost">
                <div className="box">
                    <div className="box__ghost">
                        <div className="symbol"></div>
                        <div className="symbol"></div>
                        <div className="symbol"></div>
                        <div className="symbol"></div>
                        <div className="symbol"></div>
                        <div className="symbol"></div>

                        <div className="box__ghost-container">
                            <div className="box__ghost-eyes">
                                <div className="box__eye-left"></div>
                                <div className="box__eye-right"></div>
                            </div>
                            <div className="box__ghost-bottom">
                                <div></div>
                                <div></div>
                                <div></div>
                                <div></div>
                                <div></div>
                            </div>
                        </div>
                        <div className="box__ghost-shadow"></div>
                    </div>

                    <div className="box__description">
                        <div className="box__description-container">
                            <div className="box__description-title">Whoops!</div>
                            <div className="box__description-text">It seems like we couldn't find the page you were looking for</div>
                        </div>

                        <NavLink to="/home" className="box__button" exact>Go back</NavLink>

                    </div>

                </div>
            </div>
        )
    }
}