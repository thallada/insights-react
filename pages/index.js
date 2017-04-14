import 'isomorphic-fetch';
import Immutable from 'immutable';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Head from 'next/head';
import Table from '../components/table.js';

export default class Application extends PureComponent {

  constructor (props, context) {
    super(props, context);

    this.state = {
      courses: this.props.courses,
      refreshing: false
    }

    this._onRefreshClick = this._onRefreshClick.bind(this);
  }

  static async getInitialProps ({ req }) {
    console.log('INITIAL PROPS');
    const courses = await Application.fetchCourses();
    return {'courses': courses};
  }

  static async fetchCourses () {
    let res;
    try {
      res = await fetch('http://localhost:9001/api/v0/course_summaries/', {
        headers: {
          'Authorization': 'Token edx'
        }
      });
    } catch (exception) {
      console.error(exception);
    }
    if (res !== undefined) {
      const json = await res.json();
      const list = Immutable.List(json);
      return list;
    } else {
      return Immutable.List([]);
    }
  }

  _onRefreshClick (event) {
    this.refresh();
    return true;
  }

  async refresh () {
    this.setState({refreshing: true});
    const courses = await Application.fetchCourses();
    this.setState({'courses': courses});
    this.setState({refreshing: false});
  }

  render () {
    const courses = this.state.courses ? this.state.courses : this.props.courses;
    return (
      <div>
        <Head>
          <title>Insights React Demo</title>
          <meta name="viewport" content="initial-scale=1.0, width=device-width" /> 
          <style>{`
            html, body {
              height: 98%;
              margin: 0;
						}
						html {
							font-size: 14px;
						}
						body {
							font-family: "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
							font-size: 1rem;
							font-weight: normal;
							line-height: 20px;
							-webkit-font-smoothing: antialiased;
							background-color: whitesmoke;
            }
            .contents {
              margin: 10px;
            }
          `}</style>
        </Head>
        <div className="contents">
          <h1 style={{
            marginBottom: '40px',
            fontWeight: '300'
          }}>edX Insights</h1>
          <button
            style={{
              float: 'right'
            }}
            onClick={this._onRefreshClick}
            disabled={this.state.refreshing ? 'disabled' : ''}
          >
            {this.state.refreshing ? '↻' : ''}Refresh
          </button>
          <Table list={this.props.courses} />
        </div>
      </div>
    );
  }
}
