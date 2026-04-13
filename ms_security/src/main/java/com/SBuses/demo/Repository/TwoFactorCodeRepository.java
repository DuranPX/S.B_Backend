package com.SBuses.demo.Repository;

import com.SBuses.demo.Models.TwoFactorCode;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TwoFactorCodeRepository extends MongoRepository<TwoFactorCode, String> {

    Optional<TwoFactorCode> findByEmailAndUsedFalse(String email);

    void deleteByEmail(String email);
}
