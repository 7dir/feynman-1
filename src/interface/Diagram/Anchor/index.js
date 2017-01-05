// external imports
import React from 'react'
import { DragSource } from 'react-dnd'
import { connect } from 'react-redux'
import _ from 'lodash'
// local imports
import { relativePosition, fixPositionToGrid, generateAnchorId } from 'utils'
import { sidebarWidth } from 'interface/Sidebar/styles'
import { setAnchorLocations, selectElements, addAnchors, addPropagators, mergeElements } from 'actions/elements'
import styles from './styles'
import { anchorDragType } from '../constants'


export class Anchor extends React.Component {

    static defaultProps = {
        r: 5,
        fill: 'black',
        fixed: false,
    }

    state = {
        mouseDown: false,
    }

    constructor(...args) {
        super(...args)

        // function binds
        this._mouseDown = this._mouseDown.bind(this)
        this._mouseMove = _.throttle(this._mouseMove.bind(this), 20)
        this._mouseUp = this._mouseUp.bind(this)
    }

    componentWillMount() {
        // attach a listener to mouse movements
        this.moveListener = window.addEventListener('mousemove', this._mouseMove)
        this.upListener = window.addEventListener('mouseup', this._mouseUp)
    }

    componentWillUnmount() {
        // remove the listener
        window.removeEventListener('mousemove', this.moveListener)
        window.removeEventListener('mouseup', this.upListener)
    }

    _mouseDown(event){
        // don't bubble
        event.stopPropagation()

        // grab used props
        let { id, selectAnchor, info, elements, addAnchor, addPropagator } = this.props

        // if the drag started with the alt key
        if (event.altKey) {
            // we are going to create a new anchor

            // first, we need an id for the anchor
            // note: this will also make sure we are dragging the right one
            id = generateAnchorId(elements.anchors)

            // figure out the current location for the anchor
            const pos = fixPositionToGrid(relativePosition({
                x: event.clientX,
                y: event.clientY
            }), info.gridSize)

            // create the new anchor
            addAnchor({
                id,
                ...pos,
            })

            // create a propagator linking the two anchors
            addPropagator({
                type: 'fermion',
                anchor1: this.props.id,
                anchor2: id,
            })
        }

        this.setState({
            // track the state of the mouse
            mouseDown: true,
            // make sure we are dragging the right element
            moveTarget: id
        })

        // select the appropriate component
        selectAnchor(id)
    }

    _mouseMove(event) {
        // don't bubble
        event.stopPropagation()
        // if the mouse is down
        if (this.state.mouseDown) {
            // get the used props
            const { info, x, y } = this.props

            // get the relative position of the mouse
            const pos = fixPositionToGrid(relativePosition({
                x: event.clientX,
                y: event.clientY
            }), info.gridSize)

            // if its different than our current location
            if (pos.x != x || pos.y != y) {
                // update the anchor's location
                this.props.setAnchorLocations({
                    id: this.state.moveTarget,
                    ...pos,
                })
            }
        }
    }

    _mouseUp(event){
        // don't bubble
        event.stopPropagation()
        // if we were tracking the state of the mouse
        if (this.state.mouseDown) {
            // tell the store to clean up any overlapping elements
            this.props.mergeElements(this.state.moveTarget)

            // track the state of the mouse
            this.setState({
                // clear the drag target
                moveTarget: null,
                // we are no longer holding the mouse down
                mouseDown: false
            })
        }
    }

    render() {
        const {
            x,
            y,
            dispatch,
            selected,
            r,
            fill,
            fixed,
        }  = this.props

        // get any required styling
        const styling = selected ? styles.selected : styles.notSelected
        // if

        return (
            <circle
                onMouseDown={this._mouseDown}
                cx={x}
                cy={y}
                r={r}
                fill={fill}
                {...styling}
            />
        )
    }
}

// the anchor will need
const mapDispatchToProps = (dispatch, props) => ({
    // to set its own location
    setAnchorLocations: loc => dispatch(setAnchorLocations(loc)),
    // select a given anchor
    selectAnchor: (id=props.id) => dispatch(selectElements({type: 'anchors', id})),
    // add new anchors to the diagram
    addAnchor: anchor => dispatch(addAnchors(anchor)),
    // add new propagators to the diagram
    addPropagator: propagator => dispatch(addPropagators(propagator)),
    // tell the store to merge overlapping elements
    mergeElements: id => dispatch(mergeElements(id))

})
// the anchor needs access to the diagram info and elements reducers
const mapStateToProps = ({info, elements}) => ({info, elements})

export default connect(mapStateToProps, mapDispatchToProps)(Anchor)
