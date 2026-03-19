import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface ContactDialogData {
  productTitle: string;
}

@Component({
  selector: 'app-contact-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './contact-dialog.component.html',
  styleUrl: './contact-dialog.component.scss'
})
export class ContactDialogComponent {
  contentControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(5000)]
  });

  constructor(
    private readonly dialogRef: MatDialogRef<ContactDialogComponent, string>,
    @Inject(MAT_DIALOG_DATA) public readonly data: ContactDialogData
  ) {}

  cancel(): void {
    this.dialogRef.close();
  }

  send(): void {
    const content = this.contentControl.value.trim();
    if (!content) {
      this.contentControl.markAsTouched();
      return;
    }

    this.dialogRef.close(content);
  }
}
