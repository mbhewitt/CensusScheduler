// dates
// ------------------------------------------------------------
export interface IReqYear {
  year: string;
}
export interface IResYear {
  year: string;
}

// details
// ------------------------------------------------------------
export interface IReqDateItem {
  date: string;
  name: string;
}

// row table
// ------------------------------------------------------------
export interface IResDateRowItem {
  date: string;
  id: number;
  name: string;
}
