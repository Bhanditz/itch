import { Watcher } from "common/util/watcher";
import { actions } from "common/actions";

import { each, findWhere } from "underscore";

import { IStore, ModalResponse } from "common/types";

import modalResolves from "./modals-persistent-state";
import { ITypedModal } from "renderer/modal-widgets";
import { ItchPromise } from "common/util/itch-promise";

// look, so this probably breaks the spirit of redux, not denying it,
// but also, redux has a pretty strong will, I'm sure it'll recover.

export async function promisedModal<Params, Response>(
  store: IStore,
  payload: ITypedModal<Params, Response>
): Promise<Response> {
  const modalAction = actions.openModal(payload);
  const { id } = modalAction.payload;

  const p = new ItchPromise<any>(resolve => {
    modalResolves[id] = resolve;
  });

  store.dispatch(modalAction);
  return await p;
}

export default function(watcher: Watcher) {
  watcher.on(actions.closeModal, async (store, outerAction) => {
    const { payload } = outerAction;
    const { window, action, id } = payload;

    const modals = store.getState().windows[window].modals;
    let modal = modals[0];
    if (id) {
      modal = findWhere(modals, { id });
    }

    let response: ModalResponse = null;
    if (action) {
      if (Array.isArray(action)) {
        each(action, a => store.dispatch(a));
      } else {
        store.dispatch(action);
        if (action.type === "modalResponse") {
          response = action.payload;
        }
      }
    }

    store.dispatch(
      actions.modalClosed({
        window,
        id: modal ? modal.id : id,
        response,
      })
    );
  });

  watcher.on(actions.modalClosed, async (store, outerAction) => {
    const { id, response } = outerAction.payload;

    const resolve = modalResolves[id];
    if (resolve) {
      resolve(response);
    }
  });
}
