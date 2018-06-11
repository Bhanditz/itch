import React from "react";

import env from "common/env";

import urls from "common/constants/urls";

import { IMeatProps } from "renderer/components/meats/types";

import BrowserMeat, { ControlsType } from "./browser-meat";
import { Space } from "common/helpers/space";
import { withTab } from "./meats/tab-provider";

class UrlMeat extends React.PureComponent<IProps, IState> {
  constructor(props: IProps, context) {
    super(props, context);
    this.state = {
      active: props.visible || !props.tabInstance.sleepy,
    };
  }

  render() {
    const { active } = this.state;
    if (!active) {
      return null;
    }

    const { url, controls } = this.getUrlAndControls();
    return <BrowserMeat url={url} {...this.props as any} controls={controls} />;
  }

  getUrlAndControls(): IUrlAndControls {
    const { tabInstance } = this.props;
    let controls = "generic" as ControlsType;

    const sp = Space.fromInstance(tabInstance);
    switch (sp.internalPage()) {
      case "featured":
        if (env.integrationTests) {
          return { url: "about:blank", controls };
        } else {
          return { url: urls.itchio + "/", controls };
        }
      case "games":
      case "new-tab":
        // let it simmer
        return { url: "about:blank", controls };
    }

    if (sp.prefix === "games") {
      controls = "game";
    }

    return { url: sp.url(), controls };
  }

  componentWillReceiveProps(props: IProps) {
    if (props.visible && !this.state.active) {
      this.setState({
        active: true,
      });
    }
  }
}

interface IUrlAndControls {
  url: string;
  controls: ControlsType;
}

interface IProps extends IMeatProps {
  tab: string;
}

interface IState {
  active: boolean;
}

export default withTab(UrlMeat) as React.ComponentClass<IMeatProps>;
