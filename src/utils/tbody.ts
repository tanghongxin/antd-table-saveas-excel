import { Sheet } from 'better-xlsx';
import _ from 'lodash'
import drawCell from './cell';
import getColumnRenderValue from './columnRender';
import {
  IStyle,
  IExcelColumn,
  ITbodyConfig,
  ICellProps,
  IDataSource,
  IHorizontal,
  IVertical,
  ICellType,
  INumFmt,
} from '../../app';

export function fillAndDrawTbody(
  sheet: Sheet,
  dataSource: IDataSource[],
  allColumns: IExcelColumn[],
  defaultStyle: IStyle,
  height = 1,
  config: ITbodyConfig = {},
) {
  dataSource.forEach((data, index) => {
    const row = sheet.addRow();
    const rowStyle = data.__style__ || {};
    if (rowStyle.height) {
      row.setHeightCM(rowStyle.height);
    } else {
      row.setHeightCM(height);
    }
    for (let column of allColumns) {
      const { dataIndex, __cellType__, __numFmt__, __style__ = {} } = column;
      let value = _.get(data, dataIndex);
      const cell = row.addCell();
      let hMerge = 0,
        vMerge = 0;
      let renderValue = null;
      let cellStyle: IStyle = {};
      if (column.excelRender) {
        renderValue = column.excelRender(value, data, index);
      } else if (column.render) {
        renderValue = column.render(value, data, index);
      } else if (column.customRender) {
        renderValue = column.customRender(value, data, index);
      }
      // TODO: customRender 返回 DOM?
      if (renderValue) {
        const { children, colSpan, rowSpan, __style__ } = getColumnRenderValue(
          renderValue,
        );
        value = children;
        hMerge = colSpan;
        vMerge = rowSpan;
        cellStyle = __style__;
        if (cellStyle && cellStyle.height) {
          row.setHeightCM(cellStyle.height);
        }
      }
      drawCell(
        cell,
        {
          value,
          hMerge,
          vMerge,
          cellType: __cellType__,
          numFmt: __numFmt__,
          style: {
            ...defaultStyle,
            ...__style__,
            // 允许每一行数据带上样式
            ...rowStyle,
            // 允许单元格样式
            ...cellStyle
          },
        },
        config,
      );
    }
  });
}

export function getColumns(columns: IExcelColumn[]) {
  let indexes: IExcelColumn[] = [];
  for (let column of columns) {
    const index = getColumn(column);
    indexes = indexes.concat(index);
  }
  return indexes;
}

function getColumn(column: IExcelColumn): IExcelColumn[] {
  const children = column.children;
  let indexes: IExcelColumn[] = [];
  if (children?.length) {
    for (let child of children) {
      const index = getColumn(child);
      indexes = indexes.concat(index);
    }
  } else {
    indexes.push(column);
  }
  return indexes;
}
