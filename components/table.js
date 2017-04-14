import Immutable from 'immutable'
import PropTypes from 'prop-types'
import React, { PureComponent } from 'react';
import ReactDOM from 'react-dom';
import { AutoSizer, Column, Table, SortDirection, SortIndicator } from 'react-virtualized';
import styles from 'react-virtualized/styles.css'; // only needs to be imported once
import tableStyles from '../static/table.css';
import { ContentBox } from './contentbox.js';
import moment from 'moment';

export default class CoursesTable extends PureComponent {
  // static contextTypes = {
    // list: PropTypes.instanceOf(Immutable.List).isRequired
  // };

  constructor (props, context) {
    super(props, context);

    this.state = {
      headerHeight: 30,
      height: 500,
      overscanRowCount: 10,
      rowHeight: 50,
      // sort
      sortBy: 'catalog_course_title',
      sortDirection: SortDirection.ASC,
      // filters, shouldComponentUpdate only does a shallowEqual, so I can't nest these
      availability: Immutable.Map({
        Archived: false,
        Current: false,
        Upcoming: false,
        Unknown: false
      }),
      pacing_type: Immutable.Map({
        instructor_paced: false,
        self_paced: false
      }),
      search: ''
    };

    this._getRowHeight = this._getRowHeight.bind(this);
    this._noRowsRenderer = this._noRowsRenderer.bind(this);
    this._rowClassName = this._rowClassName.bind(this);
    this._sort = this._sort.bind(this);
    this._onFilterCheck = this._onFilterCheck.bind(this);
    this._onSearchChange = this._onSearchChange.bind(this);
    this._removeFilter = this._removeFilter.bind(this);
  }

  render () {
    const {
      headerHeight,
      height,
      overscanRowCount,
      rowHeight,
      sortBy,
      sortDirection,
      availability,
      pacing_type,
      search
    } = this.state;

    const list = Immutable.List(this.props.list);
    let activatedAvailability = [],
        activatedPacing = [];

    // filter on availability
    availability.mapEntries(entry => {
      if (entry[1]) {
        activatedAvailability.push(entry[0]);
      }
    });
    let filteredList = Immutable.List(list);
    if (activatedAvailability.length > 0) {
      filteredList = list.filter(elem => {
        if (activatedAvailability.indexOf(elem.availability) === -1) {
          return false;
        }
        return true;
      });
    }

    // filter on pacing_type
    activatedPacing = [];
    pacing_type.mapEntries(entry => {
      if (entry[1]) {
        activatedPacing.push(entry[0]);
      }
    });
    if (activatedPacing.length > 0) {
      filteredList = filteredList.filter(elem => {
        if (activatedPacing.indexOf(elem.pacing_type) === -1) {
          return false;
        }
        return true;
      });
    }

    // filter on search
    if (search !== '') {
      filteredList = filteredList.filter(elem => {
        if ((elem.catalog_course !== null &&
             elem.catalog_course.toLowerCase().includes(search.toLowerCase())) ||
            (elem.catalog_course_title !== null &&
             elem.catalog_course_title.toLowerCase().includes(search.toLowerCase()))) {
          return true;
        }
        return false;
      });
    }

    // sort
    const sortedList = filteredList
      .sortBy(item => item[sortBy])
      .update(filteredList =>
        sortDirection === SortDirection.DESC
          ? filteredList.reverse()
          : filteredList
      );
    
    // calculate summaries
    const totalEmtSum = sortedList.reduce((sum, elem) => {
      return sum + elem.cumulative_count;
    }, 0).toLocaleString();
    const currEmtSum = sortedList.reduce((sum, elem) => {
      return sum + elem.count;
    }, 0).toLocaleString();
    const changeEmtSum = sortedList.reduce((sum, elem) => {
      return sum + elem.count_change_7_days;
    }, 0).toLocaleString();
    const verifiedEmtSum = sortedList.reduce((sum, elem) => {
      return sum + elem.enrollment_modes.verified.count;
    }, 0).toLocaleString();

    const rowCount = sortedList.size;
    const rowGetter = ({ index }) => this._getDatum(sortedList, index);
    const source = (typeof window !== 'undefined' && window.document && window.document.createElement)
                   ? 'client' : 'server';
    console.log('RENDER ' + source + ' ' + rowCount);

    return (
      <div>
        <h2>Across all your courses</h2>
        <hr style={{
          marginBottom: '10px'
        }} />
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          height: '100px',
          justifyContent: 'space-around',
          marginBottom: '110px',
        }}>
          <style jsx>{`
            .card {
              flex-grow: 0.75;
              min-width: 100px;
              height: 80px;
              margin: 30px;
              background-color: white;
              box-shadow: 1px 1px 7px #888888;
              text-align: center;
              padding-left: 10px;
              padding-right: 10px;
              padding-top: 30px;
              padding-bottom: 30px;
            }
            .card .number {
              display: block;
              font-size: 30px;
              font-weight: 500;
              line-height: 33px;
            }
            .card .number-desc {
              display: block;
              font-size: 18px;
              font-weight: 500;
              line-height: 19.8px;
            }
          `}</style>
          <div className="card card1">
            <span className="number">{totalEmtSum}</span><br />
            <span className="number-desc">Total Enrollment</span>
          </div>
          <div className="card card2">
            <span className="number">{currEmtSum}</span><br />
            <span className="number-desc">Current Enrollment</span>
          </div>
          <div className="card card3">
            <span className="number">{changeEmtSum}</span><br />
            <span className="number-desc">Change Last 7 Days</span>
          </div>
          <div className="card card4">
            <span className="number">{verifiedEmtSum}</span><br />
            <span className="number-desc">Verified Enrollment</span>
          </div>
        </div>
        <div>
          <h2>Course List</h2>
          <hr style={{
            marginBottom: '20px'
          }}/>
          <style jsx>{`
            form.controls {
              float: left;
              min-width: 125px;
              max-width: 180px;
            }
            div.ContentBox {
              min-width: 300px;
            }
            .active-filters {
              display: block;
              height: 25px;
              margin-left: 175px;
              padding-bottom: 10px;
            }
            .active-filter {
              background-color: white;
              padding: 5px;
              margin-right: 10px;
              box-shadow: 1px 1px 3px #888888;
            }
            button {
              border: none;
            }
          `}</style>
          <div className="active-filters">
            {search !== '' || activatedPacing.length > 0 || activatedAvailability.length > 0 ?
              <div>
                <span>Active Filters: </span>
                {search !== '' ?
                  <button className="active-filter" name="search" onClick={this._removeFilter}>
                    Search: "{search}" ✕
                  </button> : ''}
                {activatedAvailability.length > 0 ?
                  <button className="active-filter" name="availability" onClick={this._removeFilter}>
                    Availability: "{activatedAvailability.join(', ')}" ✕
                  </button> : ''}
                {activatedPacing.length > 0 ?
                  <button className="active-filter" name="pacing_type" onClick={this._removeFilter}>
                    Pacing: "{activatedPacing.join(', ')}" ✕
                  </button> : ''}
              </div>
            : ''}
          </div>
          <form className="controls">
            <h3 style={{
              marginTop: '1rem',
              marginBottom: '0.5rem'
            }}>Search:</h3>
            <label>
              <input id="search" type="text"
                onInput={this._onSearchChange}
                style={{
                  marginRight: '20px',
                  width: '150px'
                }}
                value={search}
              />
            </label><br />
            <h3 style={{
              marginTop: '1rem',
              marginBottom: '0.5rem'
            }}>Availability</h3>
            <label>
              <input className="availability" id="Archived" value="Archived" type="checkbox"
                checked={availability.get('Archived')}
                onChange={this._onFilterCheck}
              />
              Archived
            </label><br />
            <label>
              <input className="availability" id="Current" value="Current" type="checkbox"
                checked={availability.get('Current')}
                onChange={this._onFilterCheck}
              />
              Current
            </label><br />
            <label>
              <input className="availability" id="unknown" value="unknown" type="checkbox"
                checked={availability.get('unknown')}
                onChange={this._onFilterCheck}
              />
              Unknown
            </label><br />
            <label>
              <input className="availability" id="Upcoming" value="Upcoming" type="checkbox"
                checked={availability.get('Upcoming')}
                onChange={this._onFilterCheck}
              />
              Upcoming
            </label><br />
            <h3 style={{
              marginTop: '1rem',
              marginBottom: '0.5rem'
            }}>Pacing Type</h3>
            <label>
              <input className="pacing_type" id="instructor_paced" value="instructor_paced" type="checkbox"
                checked={pacing_type.get('instructor_paced')}
                onChange={this._onFilterCheck}
              />
              Instructor-Paced
            </label><br />
            <label>
              <input className="pacing_type" id="self_paced" value="self_paced" type="checkbox"
                checked={pacing_type.get('self_paced')}
                onChange={this._onFilterCheck}
              />
              Self-Paced
            </label><br />
          </form>
          <ContentBox
            style={{
              marginLeft: '20px',
              marginRight: '20px',
              boxShadow: '1px 1px 7px #888888'
            }}
          >
            <style dangerouslySetInnerHTML={{ __html: styles }} />
            <style dangerouslySetInnerHTML={{ __html: tableStyles }} />
            <AutoSizer disableHeight>
              {({ width }) => (
                <Table
                  ref='Table'
                  headerClassName='headerColumn'
                  headerHeight={headerHeight}
                  height={height}
                  noRowsRenderer={this._noRowsRenderer}
                  overscanRowCount={overscanRowCount}
                  rowClassName={this._rowClassName}
                  rowHeight={rowHeight}
                  rowGetter={rowGetter}
                  rowCount={rowCount}
                  sort={this._sort}
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  width={width}
                >
                  <Column
                    label='Course Name'
                    dataKey='catalog_course_title'
                    cellRenderer={this._courseNameRenderer}
                    width={200}
                    flexGrow={1}
                  />
                  <Column
                    label='Start Date'
                    dataKey='start_date'
                    cellRenderer={this._dateRenderer}
                    width={100}
                  />
                  <Column
                    label='End Date'
                    dataKey='end_date'
                    cellRenderer={this._dateRenderer}
                    width={100}
                  />
                  <Column
                    label='Total'
                    dataKey='cumulative_count'
                    cellRenderer={this._numberRenderer}
                    width={100}
                  />
                  <Column
                    label='Current'
                    dataKey='count'
                    cellRenderer={this._numberRenderer}
                    width={100}
                  />
                  <Column
                    label='Last 7 Days'
                    dataKey='count_change_7_days'
                    cellRenderer={this._numberRenderer}
                    width={100}
                  />
                </Table>
              )}
            </AutoSizer>
          </ContentBox>
        </div>
      </div>
    );
  }

  _getDatum (list, index) {
    return list.get(index);
  }

  _getRowHeight ({ index }) {
    const list = Immutable.List(this.props.list);

    return this._getDatum(list, index).size;
  }

  _noRowsRenderer () {
    return (
      <div className='noRows'>
        No rows
      </div>
    );
  }

  _rowClassName ({ index }) {
    if (index < 0) {
      return 'headerRow';
    } else {
      return index % 2 === 0 ? 'evenRow' : 'oddRow';
    }
  }

  _sort ({ sortBy, sortDirection }) {
    this.setState({ sortBy, sortDirection });
  }

  _courseNameRenderer ({cellData, columnData, dataKey, isScrolling, rowData, rowIndex}) {
    if (rowData['catalog_course'] === null) {
      return String('--');
    } else {
      return (
        <a href="#">
          <style jsx>{`
            a {
              text-decoration: none;
            }

            .course-title {
              color: #0075b4;
            }

            .course-id {
              color: #414141;
            }
          `}</style>
          <span className="course-title">{rowData['catalog_course_title']}</span><br />
          <span className="course-id">{rowData['catalog_course']}</span>
        </a>
      );
    }
  }

  _dateRenderer ({cellData, columnData, dataKey, isScrolling, rowData, rowIndex}) {
    moment.locale('en');
    if (cellData === null) {
      return String('--');
    } else {
      return moment.utc(cellData.split('T')[0]).format('L');
    }
  }

  _numberRenderer ({cellData, columnData, dataKey, isScrolling, rowData, rowIndex}) {
    if (cellData === null) {
      return String('--');
    } else {
      return parseInt(cellData, 10).toLocaleString();
    }
  }

  _onFilterCheck (event) {
    console.log('FILTER');
    let filterState = this.state[event.target.className],
      newState = {};
    filterState = filterState.set(event.target.value, event.target.checked);
    newState[event.target.className] = filterState;
    this.setState(newState);
  }

  _onSearchChange (event) {
    console.log('SEARCH');
    this.setState({search: event.target.value});
  }

  _removeFilter (event) {
    console.log('REMOVE FILTER');
    const filterKey = event.target.name;
    if (filterKey === 'search') {
      this.setState({search: ''});
    } else if (filterKey === 'availability') {
      this.setState({availability: Immutable.Map({
        Archived: false,
        Current: false,
        Upcoming: false,
        Unknown: false
      })});
    } else if (filterKey === 'pacing_type') {
      this.setState({pacing_type: Immutable.Map({
        instructor_paced: false,
        self_paced: false
      })});
    }
  }
}
