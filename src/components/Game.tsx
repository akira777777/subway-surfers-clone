        case "]": currentLane = Math.round(currentLane) + 1; break;
        case "[" : currentLane = Math.max(0, Math.round(currentLane) - 1); break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const index = keyDown.indexOf(e.key);
      if (index > -1) keyDown.splice(index, 1);
    };
