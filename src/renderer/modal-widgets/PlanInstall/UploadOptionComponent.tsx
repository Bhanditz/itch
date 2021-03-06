import React from "react";
import { OptionComponentProps } from "renderer/basics/SimpleSelect/DefaultOptionComponent";
import UploadIcon from "renderer/basics/UploadIcon";
import {
  formatUploadTitleFancy,
  formatUploadTitle,
} from "common/format/upload";
import { fileSize } from "common/format/filesize";
import { SelectValueDiv } from "renderer/modal-widgets/PlanInstall/select-common";
import { Upload } from "common/butlerd/messages";

export interface UploadOption {
  value: number;
  label: string;
  upload: Upload;
}

export default function UploadOptionComponent(
  props: OptionComponentProps<UploadOption>
) {
  const u = props.option.upload;
  return (
    <SelectValueDiv>
      <UploadIcon upload={u} />
      <div className="spacer" />
      <div className="title" title={formatUploadTitle(u)}>
        {formatUploadTitleFancy(u)}
      </div>
      <div className="spacer" />
      {u.size > 0 ? <div className="tag">{fileSize(u.size)}</div> : null}
      {u.demo ? <div className="tag">demo</div> : null}
      <div className="spacer" />
    </SelectValueDiv>
  );
}
