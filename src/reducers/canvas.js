/* Define your initial state here.
 *
 * If you change the type from object to something else, do not forget to update
 * src/container/App.js accordingly.
 */
import { ADD_LINE, CLEAR_CANVAS, UNDO, ADD_FRAME, CHANGE_CURRENT_FRAME, REMOVE_FRAME, UPDATE_THUMBNAIL, MOVE_FRAME } from '../actions/const';
import Frame from '../utils/frame';
import History from '../utils/history';
import { revert } from '../utils/compare';
import getFrameById from '../utils/getFrameById';

const initialState = {
  currentIndex: 0,
  frames: [new Frame()],
  history: []
};

function reducer(state = initialState, action) {
  /* Keep the reducer clean - do not mutate the original state. */
  const nextState = Object.assign({}, state);
  nextState.frames = nextState.frames.map(frame => new Frame(frame.lines, frame.thumbnail, frame.originalId));

  switch (action.type) {
    case ADD_LINE: {
      const frame = nextState.frames[nextState.currentIndex];
      frame.lines = frame.lines.slice(0);
      frame.appendLine({
        position: action.positions,
        color: action.color,
        lineWidth: action.lineWidth
      });
      updateHistory(state, nextState);
      break;
    }
    case UNDO: {
      if (nextState.history.length === 0) break;
      const history = nextState.history[state.history.length - 1];
      for (let changedFrame of history.changedFrames) {
        const frame = getFrameById(nextState.frames, changedFrame.originalId);
        frame.lines = revert(frame.lines, changedFrame.linesDiff);
      }
      nextState.frames = revert(nextState.frames, history.framesDiff);
      nextState.history.splice(nextState.history.length - 1, 1);
      nextState.currentIndex = history.currentFrameIndex;
      fixCurrentIndex(nextState);
      nextState.currentIndex = history.currentFrameIndex;
      break;
    }
    case CLEAR_CANVAS: {
      const { frames, currentIndex, history } = state;
      const lines = nextState.frames[currentIndex].lines;
      nextState.frames[currentIndex].clear();
      updateHistory(state, nextState);
      break;
    }
    case ADD_FRAME: {
      nextState.frames = [...state.frames, new Frame()];
      updateHistory(state, nextState);
      break;
    }
    case CHANGE_CURRENT_FRAME: {
      nextState.currentIndex = action.index;
      nextState.history = [...nextState.history, new History(state.currentIndex)];
      break;
    }
    case REMOVE_FRAME: {
      if (state.frames.length === 1) break;
      nextState.frames = state.frames.filter((f, index) => index !== action.index);;
      fixCurrentIndex(nextState);
      updateHistory(state, nextState);
      break;
    }
    case UPDATE_THUMBNAIL: {
      nextState.frames[action.index].updateThumbnail(action.thumbnail);
      break;
    }
    case MOVE_FRAME: {
      if (action.index === action.insertIndex) break;
      const frame = nextState.frames.splice(action.index, 1)[0];
      if (action.insertIndex > action.index) {
        nextState.frames.splice(action.insertIndex, 0, frame);
      } else {
        nextState.frames.splice(action.insertIndex - 1, 0, frame);
      }
      updateHistory(state, nextState);
      break;
    }
    default: {
      /* Return original state if no actions were consumed. */
      return state;
    }
  }
  return nextState;
}

function updateHistory(prevState, nextState) {
  nextState.history = [...nextState.history, History.compare(
    nextState.currentIndex, prevState.frames, nextState.frames)];
}

function fixCurrentIndex(nextState) {
  nextState.currentIndex = Math.min(nextState.frames.length - 1, nextState.currentIndex);
}

module.exports = reducer;
