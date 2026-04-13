package com.SBuses.demo.Models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "recovery_tokens")
public class RecoveryToken {

    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    private String code;

    private boolean used;

    private Date expiresAt;

    private int attempts;

    private Date createdAt;
}
